import { useState } from "react";
import { Box, Flex, Text, Input, Button, Stack, Field } from "@chakra-ui/react";
import { changePassword, deleteAccount } from "../../api/account";
import { isStrongPassword } from "../../utils/validation";
import { PasswordChecklist } from "./PasswordChecklist";
import { colors } from "../../theme/colors";

export function SettingsPanel({ user, onClose, onAccountDeleted }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [newPwFocused, setNewPwFocused] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwMessage("");
    if (!isStrongPassword(newPassword)) {
      setPwError("New password doesn't meet the requirements below.");
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(user.token, { currentPassword, newPassword });
      setPwMessage("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPwError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError("");
    if (!deletePassword) {
      setDeleteError("Enter your password to confirm.");
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteAccount(user.token, deletePassword);
      onAccountDeleted?.();
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Flex position="fixed" inset="0" bg="rgba(0,0,0,0.6)" align="center" justify="center" zIndex={20} p={4} onClick={onClose}>
      <Box
        w="100%" maxW="400px"
        bg={colors.panel}
        border="1px solid" borderColor={colors.border}
        borderRadius="lg" p={6}
        maxH="90dvh" overflowY="auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Text fontFamily="serif" fontSize="lg" color={colors.textHi} mb={6}>
          Settings — {user.username}
        </Text>

        <Text fontSize="sm" color={colors.textMid} mb={2}>Change Password</Text>
        <form onSubmit={handleChangePassword}>
          <Stack gap={3} mb={6}>
            <Field.Root>
              <Input
                type="password" placeholder="current password"
                value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                bg={colors.panelRaised} color={colors.textHi} borderColor={colors.border}
                _placeholder={{ color: colors.textDim }}
              />
            </Field.Root>
            <Field.Root>
              <Input
                type="password" placeholder="new password"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setNewPwFocused(true)}
                bg={colors.panelRaised} color={colors.textHi} borderColor={colors.border}
                _placeholder={{ color: colors.textDim }}
              />
              {(newPwFocused || newPassword) && <PasswordChecklist password={newPassword} />}
            </Field.Root>
            {pwError && <Text fontSize="xs" color={colors.danger}>{pwError}</Text>}
            {pwMessage && <Text fontSize="xs" color={colors.online}>{pwMessage}</Text>}
            <Button type="submit" loading={pwLoading} size="sm" bg={colors.accent} color="white" _hover={{ bg: colors.accentHover }}>
              Update Password
            </Button>
          </Stack>
        </form>

        <Box borderTop="1px solid" borderColor={colors.border} pt={4}>
          <Text fontSize="sm" color={colors.danger} mb={2}>Delete Account</Text>
          {!confirmingDelete ? (
            <Button size="sm" variant="outline" borderColor={colors.danger} color={colors.danger} onClick={() => setConfirmingDelete(true)}>
              Delete my account
            </Button>
          ) : (
            <Stack gap={3}>
              <Text fontSize="xs" color={colors.textMid}>
                This permanently deletes your account and all your messages. Enter your password to confirm.
              </Text>
              <Input
                type="password" placeholder="password"
                value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)}
                bg={colors.panelRaised} color={colors.textHi} borderColor={colors.border}
                _placeholder={{ color: colors.textDim }}
              />
              {deleteError && <Text fontSize="xs" color={colors.danger}>{deleteError}</Text>}
              <Button size="sm" loading={deleteLoading} bg={colors.danger} color="white" _hover={{ bg: colors.dangerHover }} onClick={handleDelete}>
                Confirm Delete
              </Button>
            </Stack>
          )}
        </Box>

        <Button mt={6} size="sm" variant="ghost" color={colors.textMid} onClick={onClose}>
          Close
        </Button>
      </Box>
    </Flex>
  );
}
