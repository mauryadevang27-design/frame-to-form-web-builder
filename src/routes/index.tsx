import { createFileRoute } from "@tanstack/react-router";
import { ToastProvider } from "@/features/together-tube/components/toast";
import { TogetherTubeDemo } from "@/features/together-tube/demo/TogetherTubeDemo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TogetherTube — Watch YouTube together, in sync" },
      {
        name: "description",
        content:
          "TogetherTube is a Chrome extension for private YouTube watch parties with host-controlled, synchronized playback.",
      },
      { property: "og:title", content: "TogetherTube — Watch YouTube together, in sync" },
      {
        property: "og:description",
        content:
          "Create a private room, share an invite, and watch YouTube in perfect sync with friends.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ToastProvider>
      <TogetherTubeDemo />
    </ToastProvider>
  );
}
