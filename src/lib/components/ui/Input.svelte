<script lang="ts">
  import Avatar from '$components/ui/Avatar.svelte';
  import LookupManager from '$lib/core/managers/lookup';
  import { accountsStore, avatarCache, displayNamesCache } from '$lib/stores';
  import { cn } from '$lib/utils/util';
  import { onMount } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { tv, type VariantProps } from 'tailwind-variants';
  import { slide } from 'svelte/transition';
  import { outsideClick } from '$lib/actions';

  const inputVariants = tv({
    base: cn(
      'w-full px-4 py-2 text-sm rounded-md transition-all border border-input appearance-none h-10 peer',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'focus:ring-offset-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground'
    ),
    variants: {
      variant: {
        primary: 'bg-surface-alt text-background-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'bg-transparent text-input-foreground',
        ghost: 'bg-transparent text-input-foreground border-none'
      }
    },
    defaultVariants: {
      variant: 'primary'
    }
  });

  type InputProps = HTMLInputAttributes & VariantProps<typeof inputVariants> & {
    onConfirm?: (event: Event & { currentTarget: HTMLInputElement }) => void;
    nameAutocomplete?: boolean;
  };

  let {
    class: className,
    variant,
    value = $bindable<string>(),
    onConfirm,
    nameAutocomplete = false,
    onblur,
    onkeydown,
    type,
    ...restProps
  }: InputProps = $props();

  const activeAccount = $derived($accountsStore.activeAccount);
  const initialValue = value || '';

  let inputElement = $state<HTMLInputElement>();
  // eslint-disable-next-line svelte/prefer-writable-derived -- We assign this state later
  let dropdownVisible = $state(false);
  let selectedItemId = $state<string>();
  let debounceTimeout = $state<number | undefined>();

  const autocompleteData = $derived.by(() => {
    if (!nameAutocomplete || !value) return [];

    return Array.from(displayNamesCache.entries())
      .filter(([id, name]) =>
        name.toLowerCase().includes(value.toLowerCase()) || id === value
      )
      .toSorted(([idA, nameA], [idB, nameB]) => {
        const isFriendA = avatarCache.has(idA);
        const isFriendB = avatarCache.has(idB);

        if (isFriendA && !isFriendB) return -1;
        if (!isFriendA && isFriendB) return 1;

        if (nameA === value || idA === value) return -1;
        if (nameB === value || idB === value) return 1;

        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
      });
  });

  $effect(() => {
    dropdownVisible = !!(value && autocompleteData.length) && !selectedItemId;
  });

  function handleBlur(event: FocusEvent & { currentTarget: HTMLInputElement }) {
    if (event.currentTarget.value !== initialValue && onConfirm) {
      onConfirm(event);
    }
  }

  function handleKeyDown(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
    if (event.currentTarget.value !== initialValue && event.key === 'Enter' && onConfirm) {
      onConfirm(event);
    }
  }

  function handleFocus() {
    if (value && autocompleteData.length) {
      dropdownVisible = true;
    }
  }

  function handleInput() {
    selectedItemId = undefined;

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    debounceTimeout = window.setTimeout(() => {
      if (!nameAutocomplete || !activeAccount || !value || value.length < 3) return;
      LookupManager.searchByName(activeAccount, value);
    }, 500);
  }

  function handleSearchShortcut(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'f') {
      event.preventDefault();
      inputElement?.focus();
    }
  }

  if (onConfirm) {
    onblur = handleBlur;
    onkeydown = handleKeyDown;
  }

  if (type === 'search') {
    onMount(() => {
      document.addEventListener('keydown', handleSearchShortcut);

      return () => {
        document.removeEventListener('keydown', handleSearchShortcut);
      };
    });
  }
</script>

{#if nameAutocomplete}
  <div class="relative w-full" use:outsideClick={{ handler: () => dropdownVisible = false }}>
    <input
      {...restProps}
      bind:this={inputElement}
      class={cn(inputVariants({ variant }), className)}
      autocomplete="off"
      {onblur}
      onfocus={handleFocus}
      oninput={handleInput}
      spellcheck="false"
      {type}
      bind:value
    />

    {#if dropdownVisible}
      <div
        class="absolute left-0 right-0 top-full mt-2 z-50 border border-muted bg-background shadow-popover rounded-md px-1 py-1.5 max-h-48 overflow-y-auto"
        transition:slide={{ duration: 150, easing: cubicInOut }}
      >
        {#each autocompleteData as [accountId, name] (accountId)}
          {@const fallbackAvatar = '/assets/misc/defaultOutfitIcon.png'}
          {@const avatar = avatarCache.get(accountId) || fallbackAvatar}

          <button
            class={cn(
              'flex items-center gap-2 w-full text-left px-4 py-2 text-sm truncate rounded-md',
              'hover:bg-accent hover:cursor-pointer transition-colors',
              className
            )}
            onclick={() => {
              value = name;
              selectedItemId = accountId;
              inputElement?.focus();
            }}
            type="button"
          >
            <Avatar
              alt={name}
              fallback={fallbackAvatar}
              imageClass="size-6"
              src={avatar}
            />

            <span class="text-sm">{name}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
{:else}
  <input
    {...restProps}
    bind:this={inputElement}
    class={cn(inputVariants({ variant }), className)}
    autocomplete="off"
    {onblur}
    onfocus={handleFocus}
    oninput={handleInput}
    spellcheck="false"
    {type}
    bind:value
  />
{/if}