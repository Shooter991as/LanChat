import { Stack, Text } from "@chakra-ui/react";
import { getPasswordChecks } from "../../utils/validation";
import { colors } from "../../theme/colors";

const RULES = [
  { key: "length", label: "At least 8 characters" },
  { key: "upper", label: "One uppercase letter" },
  { key: "lower", label: "One lowercase letter" },
  { key: "number", label: "One number" },
  { key: "special", label: "One special character" },
];

export function PasswordChecklist({ password }) {
  const checks = getPasswordChecks(password);
  return (
    <Stack gap={0.5} mt={1}>
      {RULES.map((rule) => {
        const ok = checks[rule.key];
        return (
          <Text key={rule.key} fontSize="xs" color={ok ? colors.online : colors.textDim}>
            {ok ? "✓" : "○"} {rule.label}
          </Text>
        );
      })}
    </Stack>
  );
}
