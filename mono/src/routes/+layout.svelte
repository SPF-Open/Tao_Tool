<script module lang="ts">
	declare const PKG: { version: string };
	declare const BUILD_DATE: string;
</script>

<script lang="ts">
	import "./layout.css";
	import { page } from "$app/state";
	import {
		Sun,
		Moon,
		Menu,
		Info,
		FileText,
		Bug,
		BookOpen,
		ScrollText,
		ChevronDown,
		Check,
	} from "lucide-svelte";
	import { fly, fade } from "svelte/transition";
	import { goto } from "$app/navigation";
	import { sidebarEnabled, sidebarOpen } from "$lib/sidebar";
	import { docs, stackDocs, presentationDocs, getDoc } from "$lib/docs";
	import type { DocEntry } from "$lib/docs";
	import NotificationQueue from "$lib/ui/NotificationQueue.svelte";
	import DebugPanel from "$lib/general/DebugPanel.svelte";
	import Modal from "$lib/ui/Modal.svelte";
	import LicenseActivation from "$lib/license/LicenseActivation.svelte";
	import LicenseGate from "$lib/license/LicenseGate.svelte";
	import { PAYWALL_ENABLED } from "$lib/license/config";
	import {
		clearLicense,
		initializeLicense,
		licenseDialogOpen,
		licenseDisplayName,
		licenseState,
	} from "$lib/license/store";
	import { formatLicenseExpiry } from "$lib/license/crypto";

	let { children } = $props();

	let darkMode = $state(
		typeof localStorage !== "undefined"
			? localStorage.getItem("darkMode") === "true"
			: false,
	);
	let showAbout = $state(false);
	let debugOpen = $state(false);
	let toolMenuOpen = $state(false);
	let docMenuOpen = $state(false);

	// Contextual docs link: on a tool route, deep-link to that tool's doc page;
	// otherwise point at the docs index.
	const docSlug = $derived(page.url.pathname.split("/")[1] ?? "");
	const docsHref = $derived(getDoc(docSlug) ? `/docs/${docSlug}` : "/docs");

	const bcSegments = $derived(page.url.pathname.split("/").filter(Boolean));

	function clickOutside(node: HTMLElement, handler: () => void) {
		function onPointerDown(e: PointerEvent) {
			if (!node.contains(e.target as Node)) handler();
		}
		document.addEventListener("pointerdown", onPointerDown, true);
		return {
			destroy() {
				document.removeEventListener(
					"pointerdown",
					onPointerDown,
					true,
				);
			},
		};
	}

	// Disable the drawer slide under reduced-motion (JS transitions aren't gated
	// by the CSS media query on their own).
	function debugFly() {
		const reduce =
			typeof window !== "undefined" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		return { x: 320, duration: reduce ? 0 : 180 };
	}

	$effect(() => {
		if (darkMode) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
		if (typeof localStorage !== "undefined") {
			localStorage.setItem("darkMode", String(darkMode));
		}
	});

	const APP_NAMES: Record<string, string> = {
		"/export": "export",
		"/import": "import",
		"/forge": "forge",
		"/format": "format",
		"/editor": "editor",
		"/library": "library",
		"/iat": "iat",
		"/audit": "audit",
	};

	let appName = $derived(APP_NAMES[page.url.pathname] ?? null);
	let protectedRoute = $derived(appName !== null);

	// Slug of the current tool when on a direct tool route (not /docs/*, etc.)
	const currentToolSlug = $derived(
		appName ? page.url.pathname.slice(1) : null,
	);

	// Slug of the current doc when on /docs/[slug]
	const currentDocSlug = $derived(
		bcSegments[0] === "docs" && bcSegments.length === 2 ? bcSegments[1] : null,
	);

	const allDocs = $derived([...docs, ...stackDocs, ...presentationDocs]);

	function switchTool(slug: string) {
		toolMenuOpen = false;
		goto(`/${slug}`);
	}

	function switchDoc(slug: string) {
		docMenuOpen = false;
		goto(`/docs/${slug}`);
	}

	$effect(() => {
		initializeLicense();
	});

	// On a page that uses the sidebar, default it open on desktop/tablet but
	// closed on phones (where it becomes an overlay drawer).
	$effect(() => {
		if ($sidebarEnabled && typeof window !== "undefined") {
			sidebarOpen.set(window.innerWidth > 640);
		}
	});

	// One Escape handler closes any transient surface: breadcrumb menus, the
	// About menu, and the sidebar drawer (no other close affordance exists
	// for keyboard users on mobile).
	$effect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return;
			const menuWasOpen = toolMenuOpen || docMenuOpen;
			toolMenuOpen = false;
			docMenuOpen = false;
			showAbout = false;
			if ($sidebarEnabled && $sidebarOpen) {
				sidebarOpen.set(false);
			}
			// Focus goes back to the chip that opened the menu, not <body>.
			if (menuWasOpen) {
				document
					.querySelector<HTMLElement>(".tool-switcher .bc-tool-btn")
					?.focus();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});

	// When a switcher menu opens, move focus onto the active option so
	// ArrowDown/ArrowUp roving works immediately (listbox contract).
	$effect(() => {
		if (!toolMenuOpen && !docMenuOpen) return;
		queueMicrotask(() => {
			document
				.querySelector<HTMLElement>(".tool-menu .tool-menu-item.active")
				?.focus();
		});
	});

	// Roving focus inside the switcher listbox: arrows/Home/End move focus
	// between the option buttons.
	function menuKeydown(e: KeyboardEvent) {
		if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
		const items = Array.from(
			(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(
				".tool-menu-item",
			),
		);
		const idx = items.indexOf(document.activeElement as HTMLElement);
		e.preventDefault();
		if (e.key === "Home") {
			items[0]?.focus();
		} else if (e.key === "End") {
			items[items.length - 1]?.focus();
		} else {
			const next = e.key === "ArrowDown" ? idx + 1 : idx - 1;
			items[(next + items.length) % items.length]?.focus();
		}
	}
</script>

{#snippet switcherItems(
		items: DocEntry[],
		activeSlug: string | null,
		onpick: (slug: string) => void,
	)}
	{#each items as d (d.slug)}
		{@const Icon = d.icon}
		<button type="button"
			class="tool-menu-item"
			class:active={d.slug === activeSlug}
			role="option"
			aria-selected={d.slug === activeSlug}
			onclick={() => onpick(d.slug)}
		>
			<span class="tm-icon" aria-hidden="true">
				<Icon size={14} strokeWidth={1.75} />
			</span>
			<span class="tm-text">
				<span class="tm-title">{d.title}</span>
				<span class="tm-sub">{d.eyebrow}</span>
			</span>
			{#if d.slug === activeSlug}
				<Check size={13} strokeWidth={2.25} aria-hidden="true" />
			{/if}
		</button>
	{/each}
{/snippet}

<header class="layout-header hide-print">
	<div class="header-left">
		{#if $sidebarEnabled}
			<button type="button"
				class="burger"
				onclick={() => sidebarOpen.update((v) => !v)}
				aria-label={$sidebarOpen ? "Close sidebar" : "Open sidebar"}
				title="Toggle sidebar"
			>
				<Menu size={15} />
			</button>
		{/if}
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<a
				href="https://lv0.eu"
				class="bc-link bc-extern"
				target="_blank"
				rel="noopener noreferrer">lv0.eu</a
			>
			<span class="bc-sep bc-sep-extern" aria-hidden="true">/</span>
			<a href="/" class="bc-link">tao</a>
			{#each bcSegments as seg, i}
				<span class="bc-sep" aria-hidden="true">/</span>
				{#if page.error}
					<!-- On an error page the deeper segments did not resolve —
					   render them as plain text instead of links to more 404s. -->
					<span class="bc-muted">{seg}</span>
				{:else if i === bcSegments.length - 1 && currentToolSlug}
					<!-- clickOutside covers the whole switcher so clicking the chip
					   toggles instead of close-then-reopen. -->
					<div
						class="tool-switcher"
						use:clickOutside={() => (toolMenuOpen = false)}
					>
						<button type="button"
							class="bc-tool-btn"
							onclick={() => (toolMenuOpen = !toolMenuOpen)}
							aria-haspopup="listbox"
							aria-expanded={toolMenuOpen}
						>
							<span>{seg}</span>
							<ChevronDown size={11} strokeWidth={2} />
						</button>
						{#if toolMenuOpen}
							<div
								class="tool-menu"
								role="listbox"
								aria-label="Switch tool"
								tabindex="-1"
								onkeydown={menuKeydown}
							>
								{@render switcherItems(docs, currentToolSlug, switchTool)}
							</div>
						{/if}
					</div>
				{:else if i === bcSegments.length - 1 && currentDocSlug}
					<div
						class="tool-switcher"
						use:clickOutside={() => (docMenuOpen = false)}
					>
						<button type="button"
							class="bc-tool-btn"
							onclick={() => (docMenuOpen = !docMenuOpen)}
							aria-haspopup="listbox"
							aria-expanded={docMenuOpen}
						>
							<span>{seg}</span>
							<ChevronDown size={11} strokeWidth={2} />
						</button>
						{#if docMenuOpen}
							<div
								class="tool-menu"
								role="listbox"
								aria-label="Switch doc"
								tabindex="-1"
								onkeydown={menuKeydown}
							>
								{@render switcherItems(allDocs, currentDocSlug, switchDoc)}
							</div>
						{/if}
					</div>
				{:else if i === bcSegments.length - 1}
					<span class="bc-current">{seg}</span>
				{:else}
					<a
						href="/{bcSegments.slice(0, i + 1).join('/')}"
						class="bc-link">{seg}</a
					>
				{/if}
			{/each}
		</nav>
	</div>
	<div class="header-right">
		<a
			class="nav-link"
			class:active={docsHref === page.url.pathname}
			href={docsHref}
			aria-label="Docs"
			title="Documentation"
		>
			<BookOpen size={15} />
			<span class="nav-link-text">Docs</span>
		</a>
		<a
			class="nav-link"
			class:active={page.url.pathname === "/changelog"}
			href="/changelog"
			aria-label="Changelog"
			title="Changelog"
		>
			<ScrollText size={15} />
			<span class="nav-link-text">Changelog</span>
		</a>
		<button type="button"
			class="icon-btn debug-toggle"
			onclick={() => (debugOpen = !debugOpen)}
			aria-label="Debug"
			aria-pressed={debugOpen}
			title="Debug"
		>
			<Bug size={15} />
		</button>
		<div class="about-container">
			<button type="button"
				class="icon-btn"
				onclick={() => (showAbout = !showAbout)}
				aria-label="About"
				aria-expanded={showAbout}
				title="About"
			>
				<Info size={15} />
			</button>
			{#if showAbout}
				<div
					class="about-menu"
					role="menu"
					use:clickOutside={() => (showAbout = false)}
				>
					<div class="about-menu-info">
						<div class="info-row">
							<span class="info-label">Version</span>
							<span class="info-value">{PKG.version}</span>
						</div>
						<div class="info-row">
							<span class="info-label">Build</span>
							<span class="info-value">{BUILD_DATE}</span>
						</div>
						{#if $licenseState.status === "valid"}
							<div class="info-row">
								<span class="info-label">License</span>
								<span class="info-value"
									>{licenseDisplayName(
										$licenseState.payload,
									)}</span
								>
							</div>
							<div class="info-row">
								<span class="info-label">Expires</span>
								<span class="info-value"
									>{formatLicenseExpiry(
										$licenseState.payload.exp,
									)}</span
								>
							</div>
						{/if}
					</div>
					{#if PAYWALL_ENABLED}
						<div class="about-menu-divider"></div>
						<button type="button"
							class="about-menu-item"
							role="menuitem"
							onclick={() => {
								licenseDialogOpen.set(true);
								showAbout = false;
							}}
						>
							<FileText size={13} />
							<span
								>{$licenseState.status === "valid"
									? "Change license"
									: "Activate license"}</span
							>
						</button>
						{#if $licenseState.status === "valid"}
							<button type="button"
								class="about-menu-item"
								role="menuitem"
								onclick={() => {
									clearLicense();
									showAbout = false;
								}}
							>
								<FileText size={13} />
								<span>Remove license</span>
							</button>
						{/if}
					{/if}
				</div>
			{/if}
		</div>
		<button type="button"
			class="icon-btn"
			onclick={() => (darkMode = !darkMode)}
			aria-label="Toggle dark mode"
			title="Toggle dark mode"
		>
			{#if darkMode}
				<Sun size={15} />
			{:else}
				<Moon size={15} />
			{/if}
		</button>
	</div>
</header>

{#if protectedRoute}
	<LicenseGate>
		{@render children()}
	</LicenseGate>
{:else}
	{@render children()}
{/if}

<Modal bind:open={$licenseDialogOpen} size="md">
	{#snippet title()}
		<span>TAO license</span>
	{/snippet}
	{#snippet children()}
		<LicenseActivation compact />
	{/snippet}
</Modal>
{#if $sidebarEnabled && $sidebarOpen}
	<button type="button"
		class="sidebar-backdrop hide-print"
		aria-label="Close menu"
		onclick={() => sidebarOpen.set(false)}
		transition:fade={{ duration: 150 }}
	></button>
{/if}

{#if debugOpen}
	<button type="button"
		class="debug-backdrop hide-print"
		aria-label="Close debug panel"
		onclick={() => (debugOpen = false)}
	></button>
	<aside class="debug-drawer hide-print" transition:fly={debugFly()}>
		<DebugPanel onclose={() => (debugOpen = false)} />
	</aside>
{/if}
<NotificationQueue />

<style>
	.layout-header {
		position: sticky;
		top: 0;
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 36px;
		padding: 0 12px;
		background: var(--bg);
		border-bottom: 1px solid var(--border);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	/* Invisible hit-area extension: keeps the compact visual size but gives
	   touch users a ≥32px target (≥40px on phones, see media query below). */
	.burger,
	.icon-btn,
	.nav-link {
		position: relative;
	}

	.burger::after,
	.icon-btn::after,
	.nav-link::after {
		content: "";
		position: absolute;
		inset: -3px;
	}

	.burger {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: none;
		background: transparent;
		color: var(--text-muted);
		border-radius: var(--radius);
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
		flex-shrink: 0;
	}

	.burger:hover {
		background: var(--surface);
		color: var(--text);
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		min-width: 0;
		/* Must stay visible: the tool/doc switcher menus are absolutely
		   positioned inside it and would be clipped by overflow: hidden. */
	}

	.bc-link,
	.bc-current {
		white-space: nowrap;
	}

	.bc-current {
		overflow: hidden;
		text-overflow: ellipsis;
		flex-shrink: 1;
	}

	.sidebar-backdrop {
		display: none;
		position: fixed;
		inset: var(--layout-header-height) 0 0 0;
		background: rgba(0, 0, 0, 0.45);
		border: none;
		z-index: 55;
		animation: fadeIn 150ms ease;
		cursor: default;
	}

	.debug-backdrop {
		position: fixed;
		inset: var(--layout-header-height) 0 0 0;
		background: rgba(0, 0, 0, 0.45);
		border: none;
		z-index: 240;
		animation: fadeIn 150ms ease;
		cursor: default;
	}

	.debug-drawer {
		position: fixed;
		top: var(--layout-header-height);
		right: 0;
		bottom: 0;
		width: 360px;
		max-width: 100vw;
		z-index: 250;
		box-shadow: var(--shadow-xl);
	}

	.bc-link {
		color: var(--text-muted);
		text-decoration: none;
		font-weight: 500;
		transition: color 0.15s;
	}

	.bc-link:hover {
		color: var(--text);
	}

	.bc-sep {
		color: var(--border-strong);
		font-size: 12px;
	}

	.bc-current {
		color: var(--text);
		font-weight: 600;
	}

	.bc-muted {
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex-shrink: 1;
		min-width: 0;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.about-container {
		position: relative;
	}

	.nav-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 28px;
		padding: 0 9px;
		border-radius: var(--radius);
		background: transparent;
		color: var(--text-muted);
		font-size: 13px;
		font-weight: 500;
		text-decoration: none;
		transition:
			background 0.15s,
			color 0.15s;
	}

	.nav-link:hover {
		background: var(--surface);
		color: var(--text);
		text-decoration: none;
	}

	.nav-link.active {
		color: var(--brand);
		font-weight: 600;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		background: transparent;
		color: var(--text-muted);
		border-radius: var(--radius);
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
	}

	.icon-btn:hover {
		background: var(--surface);
		color: var(--text);
	}

	.about-menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		padding: 6px;
		background: var(--surface-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		min-width: 230px;
		z-index: 300;
		display: flex;
		flex-direction: column;
		gap: 2px;
		animation: fadeIn 0.12s ease;
	}

	.about-menu-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 10px;
		background: transparent;
		border: none;
		border-radius: var(--radius);
		color: var(--text);
		font-size: 13px;
		cursor: pointer;
		transition: background 0.15s;
		text-align: left;
		width: 100%;
	}

	.about-menu-item:hover {
		background: var(--surface);
	}

	.about-menu-divider {
		height: 1px;
		background: var(--border);
		margin: 3px 0;
	}

	.about-menu-info {
		display: flex;
		flex-direction: column;
		gap: 5px;
		padding: 7px 10px;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
	}

	.info-label {
		font-size: 11px;
		color: var(--text-muted);
		font-weight: 500;
	}

	.info-value {
		font-size: 11px;
		font-weight: 600;
		color: var(--text);
		font-family: monospace;
		text-align: right;
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-3px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 640px) {
		.sidebar-backdrop {
			display: block;
		}
		.bc-extern,
		.bc-sep-extern {
			display: none;
		}
		.about-menu {
			max-width: calc(100vw - 16px);
			max-height: 70vh;
			overflow: auto;
		}
		.burger {
			width: 34px;
			height: 34px;
		}
		.icon-btn {
			width: 36px;
			height: 36px;
		}
		.nav-link-text {
			display: none;
		}
		.nav-link {
			width: 36px;
			height: 36px;
			padding: 0;
			justify-content: center;
		}
		.bc-tool-btn {
			height: 32px;
			padding: 0 10px;
		}
		/* Developer tool — hidden on phones to keep the topbar dense-free. */
		.debug-toggle {
			display: none;
		}
		.debug-drawer {
			width: 100vw;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sidebar-backdrop,
		.debug-backdrop {
			animation: none;
		}
	}

	@media print {
		.hide-print {
			display: none;
		}
	}

	/* ── Tool switcher ───────────────────────────────────── */
	.tool-switcher {
		position: relative;
		min-width: 0;
	}

	.bc-tool-btn {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		padding: 0 6px;
		border: none;
		background: transparent;
		color: var(--text);
		font-size: 13px;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		border-radius: var(--radius);
		transition:
			background 0.15s,
			color 0.15s;
		line-height: 1;
		height: 26px;
		min-width: 0;
	}

	.bc-tool-btn > span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.bc-tool-btn:hover {
		background: var(--surface);
		color: var(--brand);
	}

	.bc-tool-btn :global(svg) {
		color: var(--text-muted);
		flex-shrink: 0;
		transition: transform 0.15s;
	}

	.tool-menu {
		position: absolute;
		top: calc(100% + 10px);
		left: 0;
		min-width: 240px;
		padding: 5px;
		background: var(--surface-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		z-index: 300;
		display: flex;
		flex-direction: column;
		gap: 2px;
		max-height: calc(100dvh - 90px);
		overflow-y: auto;
		overscroll-behavior: contain;
		transform-origin: top left;
		animation: menuIn 0.14s ease;
	}

	.tool-menu-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 7px 10px;
		border: none;
		background: transparent;
		color: var(--text);
		font-family: inherit;
		border-radius: calc(var(--radius-lg) - 3px);
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: background 0.12s;
	}

	.tool-menu-item:hover {
		background: color-mix(in srgb, var(--text) 5%, transparent);
	}

	/* Icon tile — echoes the homepage route cards at menu scale. */
	.tm-icon {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 26px;
		height: 26px;
		border-radius: var(--radius);
		color: var(--text-muted);
		background: var(--surface);
		border: 1px solid var(--border);
		transition:
			color 0.12s,
			background 0.12s,
			border-color 0.12s;
	}

	.tm-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
		flex: 1;
		min-width: 0;
	}

	.tm-title {
		font-size: 12.5px;
		font-weight: 500;
		line-height: 1.25;
		color: inherit;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tm-sub {
		font-size: 10px;
		line-height: 1.2;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Direct-child svg = the active check mark (icons inside .tm-icon excluded). */
	.tool-menu-item > :global(svg) {
		flex-shrink: 0;
		color: var(--brand);
	}

	.tool-menu-item.active {
		background: color-mix(in srgb, var(--brand) 7%, transparent);
	}

	.tool-menu-item.active .tm-title {
		color: var(--brand);
		font-weight: 600;
	}

	.tool-menu-item.active .tm-icon {
		color: var(--brand);
		background: rgba(var(--brand-rgb), 0.1);
		border-color: rgba(var(--brand-rgb), 0.25);
	}

	@keyframes menuIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	/* Phones: the anchored dropdown would overflow narrow viewports, so it
	   becomes a near-fullwidth sheet with a 2-column tile grid. */
	@media (max-width: 640px) {
		.tool-menu {
			position: fixed;
			top: calc(var(--layout-header-height) + 6px);
			left: 10px;
			right: 10px;
			min-width: 0;
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 4px;
			padding: 8px;
			max-height: calc(
				100dvh - var(--layout-header-height) - 20px
			);
			transform-origin: top;
		}

		.tool-menu-item {
			flex-direction: column;
			justify-content: center;
			gap: 6px;
			padding: 10px 6px 8px;
			text-align: center;
		}

		.tm-icon {
			width: 32px;
			height: 32px;
		}

		.tm-title {
			font-size: 12px;
		}

		/* The check mark adds nothing in a tile grid — the brand tint on the
		   icon tile already marks the active tool. */
		.tool-menu-item > :global(svg) {
			display: none;
		}
	}

	/* Placed after every animated rule so the guards win the cascade —
	   this block must stay the last word on animation. */
	@media (prefers-reduced-motion: reduce) {
		.sidebar-backdrop,
		.debug-backdrop,
		.tool-menu {
			animation: none;
		}
	}
</style>
