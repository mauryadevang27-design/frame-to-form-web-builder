import { useState } from "react";
import { Bell, User } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ExtensionHeader } from "../components/ExtensionHeader";
import { Field } from "../components/Field";
import { ScreenBody } from "../components/PopupFrame";
import { useToast } from "../components/toast";
import type { TogetherTubeSession } from "../hooks/use-together-tube";

export const DISPLAY_NAME_MAX = 24;

export function SettingsScreen({ session }: { session: TogetherTubeSession }) {
  const { state, actions } = session;
  const toast = useToast();
  const [name, setName] = useState(state.displayName);
  const trimmed = name.trim();
  const error = !trimmed
    ? "Your name can't be empty."
    : trimmed.length > DISPLAY_NAME_MAX
      ? `Keep it under ${DISPLAY_NAME_MAX} characters.`
      : null;

  const saveName = () => {
    if (error || trimmed === state.displayName) return;
    actions.setDisplayName(trimmed);
    toast.show({ title: "Display name updated" });
  };

  return (
    <>
      <ExtensionHeader title="Settings" onBack={actions.back} />
      <ScreenBody className="space-y-5">
        <Field
          label="Display name"
          icon={<User />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => e.key === "Enter" && saveName()}
          error={error}
          hint="Shown to others in your rooms."
        />

        <div className="rounded-xl border border-border bg-surface shadow-card">
          <label className="flex cursor-pointer items-center gap-3 px-3 py-3">
            <Bell className="size-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-foreground">Join & leave alerts</p>
              <p className="text-[11.5px] text-muted-foreground">
                Notify me when people join or leave a room.
              </p>
            </div>
            <Switch
              checked={state.prefs.notifyPresence}
              onCheckedChange={(v) => actions.setPrefs({ notifyPresence: v })}
            />
          </label>
        </div>

        <div className="rounded-xl border border-border px-3 py-3 text-[11.5px] text-subtle-foreground">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-mono text-muted-foreground">0.1.0</span>
          </div>
          <div className="mt-1.5 flex justify-between">
            <span>Supported sites</span>
            <span className="text-muted-foreground">YouTube</span>
          </div>
        </div>
      </ScreenBody>
    </>
  );
}
