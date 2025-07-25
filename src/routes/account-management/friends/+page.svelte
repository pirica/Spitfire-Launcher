<script lang="ts" module>
  let isLoading = $state(false);
  let isSendingRequest = $state(false);
</script>

<script lang="ts">
  import PageContent from '$components/PageContent.svelte';
  import FriendsList from '$components/friends/FriendsList.svelte';
  import Button from '$components/ui/Button.svelte';
  import Tabs from '$components/ui/Tabs.svelte';
  import FriendManager from '$lib/core/managers/friend';
  import LookupManager from '$lib/core/managers/lookup';
  import XMPPManager from '$lib/core/managers/xmpp';
  import LoaderCircleIcon from 'lucide-svelte/icons/loader-circle';
  import UserPlusIcon from 'lucide-svelte/icons/user-plus';
  import { accountsStore, friendsStore } from '$lib/stores';
  import Input from '$components/ui/Input.svelte';
  import { nonNull, shouldErrorBeIgnored, t } from '$lib/utils/util';
  import { toast } from 'svelte-sonner';

  type ListType = 'friends' | 'incoming' | 'outgoing' | 'blocklist';

  const activeAccount = $derived(nonNull($accountsStore.activeAccount));

  $effect(() => {
    FriendManager.getSummary(activeAccount);
    XMPPManager.create(activeAccount, 'friendManagement').then(xmpp => {
      xmpp.connect();
    });
  });

  const tabs = $derived([
    { id: 'friends', name: $t('friendManagement.lists.friends'), disabled: !hasFriendsInList('friends') },
    { id: 'incoming', name: $t('friendManagement.lists.incoming'), disabled: !hasFriendsInList('incoming') },
    { id: 'outgoing', name: $t('friendManagement.lists.outgoing'), disabled: !hasFriendsInList('outgoing') },
    { id: 'blocklist', name: $t('friendManagement.lists.blocklist'), disabled: !hasFriendsInList('blocklist') }
  ]);

  // svelte-ignore state_referenced_locally
  let activeTab = $state(tabs[0].id as ListType);
  let searchQuery = $state<string>();

  function hasFriendsInList(listType: ListType) {
    return !!$friendsStore[activeAccount.accountId]?.[listType]?.size;
  }

  async function searchAndAdd(event: SubmitEvent) {
    event.preventDefault();

    if (!searchQuery) return;

    isSendingRequest = true;

    try {
      const lookupData = await LookupManager.fetchByNameOrId(activeAccount, searchQuery);

      try {
        await FriendManager.addFriend(activeAccount, lookupData.accountId);
        searchQuery = '';
        toast.success($t('friendManagement.sentFriendRequest'));
      } catch (error) {
        toast.error($t('friendManagement.failedToAdd'));
      }
    } catch (error) {
      if (shouldErrorBeIgnored(error)) return;

      console.error(error);
      toast.error($t('lookupPlayers.notFound'));
    } finally {
      isSendingRequest = false;
    }
  }
</script>

<PageContent title={$t('friendManagement.page.title')}>
  <form class="flex items-center gap-x-2" onsubmit={searchAndAdd}>
    <Input
      class="grow"
      disabled={isLoading}
      nameAutocomplete={true}
      placeholder={$t('lookupPlayers.search')}
      type="search"
      bind:value={searchQuery}
    />

    <Button
      class="p-2"
      disabled={isLoading || isSendingRequest || !searchQuery || searchQuery.length < 3}
      title={$t('friendManagement.sendFriendRequest')}
      type="submit"
      variant="epic"
    >
      {#if isSendingRequest}
        <LoaderCircleIcon class="size-5 animate-spin"/>
      {:else}
        <UserPlusIcon class="size-5"/>
      {/if}
    </Button>
  </form>

  <div>
    <Tabs {tabs} bind:activeTab/>
    <FriendsList listType={activeTab} bind:searchQuery/>
  </div>
</PageContent>