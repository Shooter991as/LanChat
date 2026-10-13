import { useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { SERVER_URL } from "../../config";
import { colors } from "../../theme/colors";

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg)$/i;
const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 10;

export function MessageBubble({
  message, mine, isGrouped, author, selectionMode, selected,
  onEnterSelection, onToggleSelect, onQuickDelete,
}) {
  const timerRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const didLongPress = useRef(false);

  // Only your own messages are selectable/deletable — others never arm the timer.
  const selectable = mine;

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePointerDown = (e) => {
    if (!selectable || selectionMode) return; // already in selection mode: a tap toggles, no need to re-arm
    didLongPress.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      onEnterSelection(message.id);
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e) => {
    if (!timerRef.current) return;
    const dx = Math.abs(e.clientX - startPos.current.x);
    const dy = Math.abs(e.clientY - startPos.current.y);
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) clearTimer(); // scrolling, not long-pressing
  };

  const handlePointerUp = () => clearTimer();

  const handleClick = () => {
    if (didLongPress.current) {
      didLongPress.current = false; // long-press already handled this gesture — swallow the trailing click
      return;
    }
    if (selectionMode && selectable) onToggleSelect(message.id);
  };

  const isImage = message.mediaUrl && IMAGE_EXT.test(message.mediaUrl);

  return (
    <Flex
      align="center"
      gap={1.5}
      justify={mine ? "flex-end" : "flex-start"}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
      cursor={selectable ? "pointer" : "default"}
      userSelect="none"
    >
      {mine && selectionMode && (
        <Box
          w="18px" h="18px" borderRadius="full" flexShrink={0}
          border="2px solid" borderColor={selected ? colors.accent : colors.textDim}
          bg={selected ? colors.accent : "transparent"}
          display="flex" alignItems="center" justifyContent="center"
        >
          {selected && <Text fontSize="10px" color="white">✓</Text>}
        </Box>
      )}

      {mine && !selectionMode && (
        <Text
          fontSize="xs" color={colors.textDim}
          _hover={{ color: colors.danger }}
          onClick={(e) => { e.stopPropagation(); onQuickDelete(message.id); }}
          title="Delete for everyone"
        >
          🗑
        </Text>
      )}

      <Box
        bg={mine ? colors.accent : colors.panelRaised}
        color={mine ? "white" : colors.textHi}
        px={message.mediaUrl && !message.content ? 1 : 3}
        py={message.mediaUrl && !message.content ? 1 : 2}
        borderRadius="lg"
        fontSize="sm"
        maxW="100%"
        opacity={selectionMode && !selected && mine ? 0.55 : 1}
        transition="opacity 0.15s"
      >
        {message.mediaUrl && (
          isImage ? (
            <Box as="img" src={`${SERVER_URL}${message.mediaUrl}`} maxW="240px" borderRadius="sm" display="block" />
          ) : (
            <Text
              as="a" href={`${SERVER_URL}${message.mediaUrl}`} target="_blank" rel="noreferrer"
              textDecoration="underline" px={message.content ? 0 : 2}
            >
              📎 {message.mediaName || "attachment"}
            </Text>
          )
        )}
        {message.content && <Text mt={message.mediaUrl ? 1 : 0}>{message.content}</Text>}
      </Box>
    </Flex>
  );
}
