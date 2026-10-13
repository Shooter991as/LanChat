import { Box, SimpleGrid, Text, Flex } from "@chakra-ui/react";
import { colors } from "../../theme/colors";

export const ATTACHMENT_TYPES = [
  { key: "photo", label: "Photos", icon: "🖼️", accept: ".jpg,.jpeg,.png,.gif,.webp,image/*" },
  { key: "video", label: "Video", icon: "🎬", accept: ".mp4,.mov,.webm,video/*" },
  { key: "audio", label: "Audio", icon: "🎵", accept: ".mp3,.wav,.ogg,audio/*" },
  { key: "pdf", label: "PDF", icon: "📄", accept: ".pdf" },
  { key: "doc", label: "Document", icon: "📝", accept: ".doc,.docx" },
  { key: "sheet", label: "Spreadsheet", icon: "📊", accept: ".xls,.xlsx,.csv" },
  { key: "text", label: "Text File", icon: "📃", accept: ".txt" },
  { key: "archive", label: "Archive", icon: "🗜️", accept: ".zip,.rar,.7z" },
  { key: "code", label: "Code File", icon: "💻", accept: ".js,.ts,.py,.json,.html,.css,.java,.c,.cpp" },
  { key: "other", label: "Any File", icon: "📎", accept: "*" },
];

export function AttachmentMenu({ onSelect, onClose }) {
  return (
    <>
      {/* Mobile: full-screen scrim so tapping outside closes it, matches a bottom-sheet feel */}
      <Box
        display={{ base: "block", md: "none" }}
        position="fixed" inset="0" bg="rgba(0,0,0,0.5)" zIndex={14}
        onClick={onClose}
      />
      <Box
        position={{ base: "fixed", md: "absolute" }}
        bottom={{ base: 0, md: "56px" }}
        left={{ base: 0, md: "12px" }}
        right={{ base: 0, md: "auto" }}
        w={{ base: "100%", md: "280px" }}
        bg={colors.panel}
        border="1px solid" borderColor={colors.border}
        borderTopRadius={{ base: "lg", md: "md" }}
        borderBottomRadius={{ base: 0, md: "md" }}
        p={4}
        boxShadow="0 -8px 30px rgba(0,0,0,0.4)"
        zIndex={15}
      >
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontSize="xs" color={colors.textDim} letterSpacing="wide">ATTACH</Text>
          <Text fontSize="xs" color={colors.textMid} cursor="pointer" onClick={onClose}>✕</Text>
        </Flex>
        <SimpleGrid columns={{ base: 4, md: 3 }} gap={2}>
          {ATTACHMENT_TYPES.map((type) => (
            <Flex
              key={type.key}
              direction="column" align="center" justify="center" gap={1}
              py={3} borderRadius="md" cursor="pointer"
              bg={colors.panelRaised}
              _hover={{ bg: colors.border }}
              onClick={() => onSelect(type)}
            >
              <Text fontSize="xl">{type.icon}</Text>
              <Text fontSize="10px" color={colors.textMid} textAlign="center">{type.label}</Text>
            </Flex>
          ))}
        </SimpleGrid>
      </Box>
    </>
  );
}
