<script>
	/**
	 * @component AllStatsList
	 * Displays all derived stats grouped into 4 categories.
	 * @prop {Object} total — result from computeCharacterStats()
	 * @prop {boolean} showAll — if true, show all stats including 0%; if false, hide 0% values
	 */
	let { total, showAll = true } = $props();
</script>

<div class="stats-container">
	<!-- OFFENSE -->
	<div class="stat-section">
		<div class="section-title">OFFENSE</div>
		{#each [
			['ATK', total.atk.toLocaleString()],
			['MATK', total.matk.toLocaleString()],
			['Weapon ATK', total.weaponAtk.toLocaleString()],
			['Critical Rate', total.criticalRate + ''],
			['Critical Damage', total.criticalDamage + '%'],
			['Stability', total.stability + '%'],
			['Accuracy', total.accuracy + ''],
			['Phys Pierce', total.pierce.physical + '%'],
			['Magic Pierce', total.pierce.magic + '%'],
			['Short Range', '+' + total.damage.shortRange + '%'],
			['Long Range', '+' + total.damage.longRange + '%'],
			['Dmg to Boss', '+' + total.damage.toBoss + '%'],
			['Unsheathe', '+' + total.damage.unsheathe + '%'],
			['Ailment Res', total.ailmentResistance + '%']
		] as [k, v] (k)}
			{#if showAll || (v !== '0%' && v !== '+0%' && v !== '0')}
				<div class="stat-row">
					<span class="stat-key">{k}</span>
					<span class="stat-val">{v}</span>
				</div>
			{/if}
		{/each}
	</div>

	<!-- DEFENSE -->
	<div class="stat-section">
		<div class="section-title">DEFENSE</div>
		{#each [
			['MaxHP', total.maxHp.toLocaleString()],
			['MaxMP', total.maxMp.toLocaleString()],
			['DEF', total.def + ''],
			['MDEF', total.mdef + ''],
			['Guard Power', total.guard.power + '%'],
			['Guard Break', total.guard.break + '%'],
			['Guard Recharge', total.guard.recharge + '%'],
			['Evasion Recharge', total.evasion.recharge + '%'],
			['Phys Res', total.resistance.physical + '%'],
			['Magic Res', total.resistance.magic + '%'],
			['Neutral Res', total.resistance.neutral + '%'],
			['Fractional Barrier', total.barrier.fractional + '%'],
			['Aggro', total.aggro + '%']
		] as [k, v] (k)}
			{#if showAll || (v !== '0%' && v !== '+0%' && v !== '0')}
				<div class="stat-row">
					<span class="stat-key">{k}</span>
					<span class="stat-val">{v}</span>
				</div>
			{/if}
		{/each}
	</div>

	<!-- OTHER -->
	<div class="stat-section">
		<div class="section-title">OTHER</div>
		{#each [
			['Flee', total.flee + ''],
			['ASPD', total.aspd + ''],
			['CSPD', total.cspd + ''],
			['Cast Motion Speed', total.castMotionSpeed.toFixed(1) + '%'],
			['Motion Speed', '+' + total.motionSpeed.toFixed(0) + '%'],
			['AMPR', total.ampr + ''],
			['NHPR', total.nhprTotal + ''],
			['NMPR', total.nmprTotal + '']
		] as [k, v] (k)}
			{#if showAll || (v !== '0%' && v !== '+0%' && v !== '0')}
				<div class="stat-row">
					<span class="stat-key">{k}</span>
					<span class="stat-val">{v}</span>
				</div>
			{/if}
		{/each}
	</div>

	<!-- REDUCE DMG -->
	<div class="stat-section">
		<div class="section-title">REDUCE DMG</div>
		{#each [
			['Player Epicenter', total.reduceDmg.playerEpicenter + '%'],
			['Foe Epicenter', total.reduceDmg.foeEpicenter + '%'],
			['Straight Line', total.reduceDmg.straightLine + '%'],
			['Charge', total.reduceDmg.charge + '%'],
			['Floor', total.reduceDmg.floor + '%'],
			['Bullet', total.reduceDmg.bullet + '%'],
			['Bowling', total.reduceDmg.bowling + '%'],
			['Meteor', total.reduceDmg.meteor + '%']
		] as [k, v] (k)}
			{#if showAll || (v !== '0%')}
				<div class="stat-row">
					<span class="stat-key">{k}</span>
					<span class="stat-val">{v}</span>
				</div>
			{/if}
		{/each}
	</div>

	<!-- ELEMENT -->
	<div class="stat-section">
		<div class="section-title">ELEMENT</div>
		<div class="stat-row-full">
			<span class="stat-key">Player Element</span>
			<span class="stat-val">{total.playerElement ?? 'Neutral'}</span>
		</div>
		{#if total.playerElement}
			<div class="stat-row-full">
				<span class="stat-key">Awaken Matching</span>
				<span class="stat-val">{total.elementAwakenMatching ? 'Yes' : 'No'}</span>
			</div>
		{/if}
		<div class="elem-grid">
			<div class="elem-col">
				<div class="col-head">DAMAGE</div>
				{#each [
					['Fire', '+' + total.elementAttack.fire + '%'],
					['Water', '+' + total.elementAttack.water + '%'],
					['Wind', '+' + total.elementAttack.wind + '%'],
					['Earth', '+' + total.elementAttack.earth + '%'],
					['Light', '+' + total.elementAttack.light + '%'],
					['Dark', '+' + total.elementAttack.dark + '%']
				] as [k, v] (k)}
					{#if showAll || (v !== '+0%')}
						<div class="stat-row">
							<span class="stat-key">{k}</span>
							<span class="stat-val">{v}</span>
						</div>
					{/if}
				{/each}
			</div>
			<div class="elem-col">
				<div class="col-head">RESISTANCE</div>
				{#each [
					['Fire', total.resistance.fire + '%'],
					['Water', total.resistance.water + '%'],
					['Wind', total.resistance.wind + '%'],
					['Earth', total.resistance.earth + '%'],
					['Light', total.resistance.light + '%'],
					['Dark', total.resistance.dark + '%']
				] as [k, v] (k)}
					{#if showAll || (v !== '0%')}
						<div class="stat-row">
							<span class="stat-key">{k}</span>
							<span class="stat-val">{v}</span>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.stats-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.stat-section {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.3rem 0;
		border-bottom: 1px solid var(--border);
	}
	.stat-section:last-of-type {
		border-bottom: none;
	}
	.section-title {
		font-size: 0.55rem;
		font-weight: 700;
		color: var(--teal);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 0.1rem;
	}
	.stat-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.12rem 0.3rem;
		border-radius: 3px;
		background: rgba(255, 255, 255, 0.015);
	}
	.stat-key {
		font-size: 0.62rem;
		color: var(--text-mid);
	}
	.stat-val {
		font-size: 0.68rem;
		font-weight: 600;
		color: var(--text-bright);
		font-variant-numeric: tabular-nums;
	}
	.stat-row-full {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.12rem 0.3rem;
		border-radius: 3px;
		background: rgba(255, 255, 255, 0.015);
		grid-column: 1 / -1;
	}
	.elem-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.4rem;
	}
	.elem-col {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.col-head {
		font-size: 0.5rem;
		font-weight: 700;
		color: var(--teal);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 0.05rem;
		opacity: 0.7;
	}

	@media (max-width: 700px) {
		.stat-section {
			padding: 0.25rem 0;
		}
		.stat-row {
			padding: 0.1rem 0.25rem;
		}
	}
</style>