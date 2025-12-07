import React from "react";
import ReactMarkdown from "react-markdown";
import { GroupedMessages } from "@/types";
import { MessageAvatar } from "./MessageAvatar";
import {
  isTextContentBlock,
  isToolResultContentBlock,
  isImageContentBlock,
} from "@4g3n7/shared";

interface UserMessageProps {
  group: GroupedMessages;
  messageIdToIndex: Record<string, number>;
}

export const UserMessage = React.memo(
  function UserMessage({ group, messageIdToIndex }: UserMessageProps) {
    const isFirst = messageIdToIndex[group.messages[0].id] === 0;

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <div
        className={`flex items-start gap-2 px-4 py-3 ${
          isFirst
            ? "sticky top-0 z-10 rounded-t-lg border border-[var(--border)]/70 bg-[rgba(18,28,51,0.9)]"
            : "border-x border-[var(--border)]/60 bg-[rgba(15,22,40,0.75)]"
        }`}
      >
        {children}
      </div>
    );

    return (
      <Wrapper>
        <MessageAvatar role={group.role} />
        <div className="w-full">
          {group.messages.map((message) => (
            <div
              key={message.id}
              data-message-index={messageIdToIndex[message.id]}
            >
              {message.content.map((block, blockIndex) => {
                if (
                  isToolResultContentBlock(block) &&
                  block.content &&
                  block.content.length > 0
                ) {
                  const markers: React.ReactNode[] = [];
                  block.content.forEach((contentItem, contentIndex) => {
                    if (isImageContentBlock(contentItem)) {
                      markers.push(
                        <div
                          key={`${blockIndex}-${contentIndex}`}
                          data-message-index={messageIdToIndex[message.id]}
                          data-block-index={blockIndex}
                          data-content-index={contentIndex}
                          style={{
                            position: "absolute",
                            width: 0,
                            height: 0,
                            overflow: "hidden",
                          }}
                        />,
                      );
                    }
                  });
                  return markers;
                }
                return null;
              })}
              <div className="space-y-2 rounded-md border border-[var(--border)]/70 bg-[rgba(255,255,255,0.03)] px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
                {message.content.map((block, index) => (
                  <div
                    key={index}
                    className="text-sm leading-relaxed text-[var(--foreground)]"
                  >
                    {isTextContentBlock(block) && (
                      <ReactMarkdown>{block.text}</ReactMarkdown>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {!isFirst && <MessageAvatar role={group.role} />}
      </Wrapper>
    );
  },
  (prevProps, nextProps) =>
    prevProps.group.role === nextProps.group.role &&
    prevProps.messageIdToIndex === nextProps.messageIdToIndex &&
    prevProps.group.messages.length === nextProps.group.messages.length,
);
