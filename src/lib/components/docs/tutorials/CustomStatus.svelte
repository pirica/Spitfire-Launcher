<script lang="ts">
  import BaseModal from '$components/docs/BaseModal.svelte';
  import { accountsStore, avatarCache } from '$lib/stores';
  import { nonNull, t } from '$lib/utils/util';

  const activeAccount = $derived(nonNull($accountsStore.activeAccount));

  const nameFallback = 'Burak';
  const avatarFallback = '/assets/misc/rookie-spitfire-icon.png';
</script>

<BaseModal>
  <h2>{$t('customStatus.page.title')}</h2>
  <p>
    {$t('docs.customStatus.description')}
  </p>

  <div class="bg-gradient-to-r from-[#005ba3] to-[#0674b5] w-3/4 mx-auto h-16 flex items-center px-4 rounded-sm">
    <div class="relative mr-5">
      <div class="size-10 bg-gradient-to-b from-[#0049ae] to-[#0570c1] rounded-full flex items-center justify-center">
        <img
          class="rounded-full"
          alt="Avatar"
          src={avatarCache.get(activeAccount.accountId) || avatarFallback}
        >
      </div>
      <div class="absolute -bottom-0.5 -right-0.5 size-3.5 bg-green-500 border-2 border-[#0164aa] rounded-full"></div>
    </div>

    <div class="flex flex-col leading-tight overflow-hidden">
      <span class="text-white font-burbank font-semibold">{activeAccount.displayName || nameFallback}</span>
      <span class="text-[#78abd2] font-heading-now font-semibold text-sm uppercase outline-none whitespace-nowrap" contenteditable>
        {$t('docs.customStatus.status')}
      </span>
    </div>
  </div>
</BaseModal>