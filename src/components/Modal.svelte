<script>
  // A native <dialog>: focus trapping, Escape and the backdrop come from the
  // platform rather than from script.
  let { dialog = $bindable(), testid, title, children } = $props();
</script>

<dialog
  bind:this={dialog}
  data-testid={testid}
  onclick={(e) => e.target === dialog && dialog.close()}
>
  <div class="body">
    <header>
      <h2>{title}</h2>
      <button
        class="close"
        data-testid={`${testid}-close`}
        aria-label="Close"
        onclick={() => dialog.close()}
      >
        ×
      </button>
    </header>

    <div class="content">
      {@render children()}
    </div>
  </div>
</dialog>

<style>
  dialog {
    border: none;
    padding: 0;
    max-width: min(560px, 92vw);
    border-radius: var(--radius-lg);
    background: var(--surface);
    color: var(--ink);
    box-shadow: 0 18px 50px rgb(8 20 12 / 28%);
  }

  dialog::backdrop {
    background: rgb(8 20 12 / 55%);
  }

  .body {
    display: grid;
    gap: 12px;
    padding: 16px 18px 20px;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  h2 {
    font-size: 18px;
  }

  .close {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: var(--surface-sunken);
    color: var(--ink-muted);
    font-size: 19px;
    line-height: 1;
    cursor: pointer;
    flex: 0 0 auto;
  }

  .close:hover {
    background: var(--green-100);
    color: var(--ink);
  }

  .close:focus-visible {
    outline: 3px solid var(--green-500);
    outline-offset: 2px;
  }

  .content {
    font-size: 14px;
    line-height: 1.6;
    color: var(--ink-muted);
  }
</style>
