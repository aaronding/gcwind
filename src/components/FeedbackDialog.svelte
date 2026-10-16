<script>
  import Modal from './Modal.svelte';

  // Posts to this site's own /api/feedback, so no third-party form service ever
  // sees what people write. Nothing leaves the page until Send is pressed.
  let { dialog = $bindable() } = $props();

  const MAX = 10_000;

  let message = $state('');
  /** @type {'idle' | 'sending' | 'sent' | 'failed'} */
  let status = $state('idle');
  // The honeypot: hidden from people and from screen readers, so only a bot
  // fills it in. Sent only when it has something in it.
  let website = $state('');

  const canSend = $derived(message.trim() !== '' && status !== 'sending');

  async function send(event) {
    event.preventDefault();
    if (!canSend) return;

    status = 'sending';
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(website === '' ? { message } : { message, website })
      });

      if (!response.ok) throw new Error(String(response.status));
      status = 'sent';
      message = '';
    } catch {
      // Keep what was written so it is not lost.
      status = 'failed';
    }
  }
</script>

<Modal bind:dialog testid="feedback-dialog" title="Share feedback" wide>
  <form onsubmit={send}>
    <label for="feedback-message">What would you like to tell us?</label>
    <!-- The native dialog focuses `autofocus` on every open, so people can type at once. -->
    <!-- svelte-ignore a11y_autofocus -->
    <textarea
      autofocus
      id="feedback-message"
      data-testid="feedback-message"
      bind:value={message}
      maxlength={MAX}
      rows="12"
      required
      placeholder="A bug, an idea, a club that looks wrong. Leave your email if you'd like a reply."
    ></textarea>

    <!-- Out of sight and out of the accessibility tree: only a bot fills it. -->
    <input
      class="honeypot"
      type="text"
      name="website"
      tabindex="-1"
      autocomplete="off"
      aria-hidden="true"
      bind:value={website}
    />

    <div class="actions">
      <p class="status" role="status" data-testid="feedback-status">
        {#if status === 'sending'}
          Sending…
        {:else if status === 'sent'}
          Thanks — sent.
        {:else if status === 'failed'}
          Could not send. Try again in a minute.
        {/if}
      </p>

      <button class="chunky send" type="submit" data-testid="feedback-send" disabled={!canSend}>
        Send
      </button>
    </div>
  </form>
</Modal>

<style>
  form {
    display: grid;
    gap: 10px;
  }

  label {
    font-weight: 600;
    color: var(--ink);
    font-size: 14px;
  }

  textarea {
    width: 100%;
    resize: vertical;
    padding: 10px 12px;
    border: 1px solid var(--edge);
    border-radius: var(--radius);
    background: var(--surface-sunken);
    color: var(--ink);
    font: inherit;
    font-size: 15px;
    line-height: 1.5;
  }

  textarea:focus-visible {
    outline: 3px solid var(--green-500);
    outline-offset: 1px;
  }

  /* display:none, not .visually-hidden — that utility exists to keep content
     available to screen readers, which is the opposite of what a honeypot
     wants. aria-hidden and tabindex are belt and braces. */
  .honeypot {
    display: none;
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .status {
    margin: 0;
    font-size: 13px;
    color: var(--ink-muted);
    min-height: 1.2em;
  }

  .send {
    padding: 0 24px;
    font-weight: 700;
    background: var(--green-500);
    color: var(--on-dark);
    box-shadow: 0 var(--bevel) 0 var(--green-700);
    flex: 0 0 auto;
  }

  .send:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
</style>
