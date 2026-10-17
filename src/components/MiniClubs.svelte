<script>
  // A bag's seven clubs as small pictures in one row, for lists of bags: the
  // bag manager, and the summary of a backup before it is imported.
  import { CLUB_TYPES, clubFor } from '../lib/clubs.js';

  let { selections, label } = $props();

  const clubs = $derived(
    CLUB_TYPES.map(({ key }) => {
      const { club: name, level } = selections[key];
      return { key, name, level, image: clubFor(key, name)?.image };
    })
  );
</script>

<ul class="mini" aria-label={label}>
  {#each clubs as club (club.key)}
    <li title={`${club.name} · Lv ${club.level}`}>
      {#if club.image}
        <img src={`images/${club.image}`} alt="" width="26" height="26" loading="lazy" />
      {/if}
      <span class="visually-hidden">{club.name}, level {club.level}</span>
    </li>
  {/each}
</ul>

<style>
  .mini {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 4px;
  }

  .mini li {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--surface);
  }

  .mini img {
    width: 26px;
    height: 26px;
    object-fit: contain;
  }
</style>
