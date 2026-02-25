<script lang="ts">
  import FriendCardSkeleton from '$components/modules/friends/skeletons/FriendCardSkeleton.svelte';
</script>

<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl-plus:grid-cols-4">
  <div class="hidden sm:contents">
    <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
    {#each Array(12) as _, index (index)}
      <FriendCardSkeleton />
    {/each}
  </div>

  <div class="hidden not-sm:contents">
    <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
    {#each Array(6) as _, index (index)}
      <FriendCardSkeleton />
    {/each}
  </div>
</div>
