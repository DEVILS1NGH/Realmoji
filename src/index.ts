import { after } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";

const MessageParser =
  findByProps("parse", "unparse") ||
  findByProps("processMessage");

const emojiRegex = /<a?:\w+:(\d+)>/g;

let unpatch: (() => void) | undefined;

function buildEmojiObject(id: string, animated: boolean, name = "realmoji") {
  const ext = animated ? "gif" : "png";

  return {
    type: "customEmoji",
    id,
    name,
    animated,
    src: `https://media.discordapp.net/emojis/${id}.${ext}?size=48&quality=lossless`
  };
}

export function onLoad() {
  if (!MessageParser) return;

  unpatch = after("parse", MessageParser, (_, args, res) => {
    if (!res || !Array.isArray(res.content)) return;

    const newContent: any[] = [];

    for (const part of res.content) {
      if (typeof part === "string") {
        let match;
        let lastIndex = 0;

        while ((match = emojiRegex.exec(part)) !== null) {
          const fullMatch = match[0];
          const id = match[1];
          const isAnimated = fullMatch.startsWith("<a:");

          const beforeText = part.slice(lastIndex, match.index);
          if (beforeText) newContent.push(beforeText);

          newContent.push(buildEmojiObject(id, isAnimated));

          lastIndex = match.index + fullMatch.length;
        }

        const remaining = part.slice(lastIndex);
        if (remaining) newContent.push(remaining);
      } else {
        newContent.push(part);
      }
    }

    res.content = newContent;
    return res;
  });
}

export function onUnload() {
  if (unpatch) unpatch();
}
