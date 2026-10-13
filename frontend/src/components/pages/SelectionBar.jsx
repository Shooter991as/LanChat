import { Flex, Text, Button } from "@chakra-ui/react";
import { colors } from "../../theme/colors";

export function SelectionBar({ count, onCancel, onDelete }) {
  return (
    <Flex
      px={5} py={3} borderBottom="1px solid" borderColor={colors.border}
      align="center" justify="space-between" bg={colors.panelRaised}
    >
      <Text color={colors.textHi} fontWeight="semibold" fontSize="sm">
        {count} selected
      </Text>
      <Flex gap={2}>
        <Button size="sm" variant="ghost" color={colors.textMid} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm" bg={colors.danger} color="white" _hover={{ bg: colors.dangerHover }}
          onClick={onDelete} disabled={count === 0}
        >
          Delete
        </Button>
      </Flex>
    </Flex>
  );
}
