<script lang="ts">
  type Props = {
    title?: string;
    videoId: string;
  };

  const { title, videoId }: Props = $props();
</script>

<iframe
  class="aspect-video w-full"
  allow="clipboard-write; encrypted-media;"
  allowfullscreen
  src="https://www.youtube-nocookie.com/embed/{videoId}"
  {title}
></iframe>
