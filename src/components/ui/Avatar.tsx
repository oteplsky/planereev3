import { Users } from "lucide-react";
import { avatarBg, initials } from "@/lib/learners";
import type { Learner } from "@/lib/types";

const sizes = {
  sm: { box: "size-8", text: "text-caption font-bold", badge: "size-4 -right-0.5 -bottom-0.5", icon: 10 },
  md: { box: "size-10", text: "text-caption font-bold", badge: "size-5 -right-1 -bottom-1", icon: 12 },
  lg: { box: "size-12", text: "text-body font-bold", badge: "size-5 -right-1 -bottom-1", icon: 12 },
  /** The learner selector: 15% smaller than xl. */
  selector: { box: "size-12", text: "text-body-lg font-semibold", badge: "size-5 -right-1 -bottom-1", icon: 12 },
  xl: { box: "size-14", text: "text-h3", badge: "size-6 -right-1 -bottom-1", icon: 14 },
  profile: { box: "size-24", text: "text-h1", badge: "size-7 right-0 bottom-0", icon: 16 },
} as const;

interface AvatarProps {
  learner: Learner;
  size?: keyof typeof sizes;
  className?: string;
  /** Overrides `learner.avatarUrl`, e.g. a picture chosen in the profile. */
  src?: string | null;
}

/**
 * Learner avatar: a photo or picture when there is one, initials otherwise.
 * Groups get a small people badge so type isn't conveyed by colour alone.
 */
export function Avatar({ learner, size = "md", className = "", src }: AvatarProps) {
  const s = sizes[size];
  const image = src ?? learner.avatarUrl;
  return (
    <span className={`relative inline-flex shrink-0 align-top ${className}`} aria-hidden="true">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- small avatar, local or picked file
        <img src={image} alt="" className={`${s.box} block rounded-full object-cover`} />
      ) : (
        <span
          className={`${s.box} ${s.text} ${avatarBg[learner.avatarColor]} grid place-items-center rounded-full text-ink`}
        >
          {initials(learner)}
        </span>
      )}
      {learner.type === "group" && (
        <span
          className={`${s.badge} absolute grid place-items-center rounded-full border-2 border-surface bg-ink text-white`}
        >
          <Users size={s.icon} strokeWidth={2.25} />
        </span>
      )}
    </span>
  );
}
