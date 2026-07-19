<script>
</script>

<footer class="footer">
	<div class="footer-inner">
		<div class="footer-brand">
			<span class="footer-text">TORAM BUILD LAB</span>
		</div>
		<div class="footer-links">
			<a href="https://haotian.my.id" class="footer-link" target="_blank" rel="noopener">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="2" y1="12" x2="22" y2="12" />
					<path
						d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
					/>
				</svg>
				<span>Haotian</span>
			</a>
		</div>
		<p class="footer-copy">© 2026 — Not created with love. LoL</p>
	</div>
</footer>

<style>
	.footer {
		border-top: 1px solid var(--border);
		background: rgba(8, 12, 20, 0.85);
		backdrop-filter: blur(8px);
		margin-top: auto;
	}

	.footer-inner {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1.25rem 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.footer-brand {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.footer-text {
		font-family: var(--pixel);
		font-size: 0.55rem;
		color: var(--text-dim);
		letter-spacing: 0.06em;
	}

	.footer-links {
		display: flex;
		gap: 1rem;
	}

	.footer-link {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		color: var(--text-dim);
		text-decoration: none;
		font-family: var(--pixel);
		font-size: 0.5rem;
		transition: color 0.2s;
	}
	.footer-link:hover {
		color: var(--teal);
	}

	.footer-copy {
		font-size: 0.7rem;
		color: var(--text-dim);
		width: 100%;
		text-align: center;
		margin-top: 0.5rem;
	}

	@media (max-width: 480px) {
		.footer-inner {
			flex-direction: column;
			text-align: center;
		}
	}
</style>
