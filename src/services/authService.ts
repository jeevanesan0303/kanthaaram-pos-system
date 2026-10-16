import { supabase } from '../lib/supabase';

export const authService = {
  async changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user?.email) {
    throw new Error(
      'The administrator email could not be identified.',
    );
  }

  // Verify the current password.
  const { error: verificationError } =
    await supabase.auth.signInWithPassword({
      email: user.email,
      password: input.currentPassword,
    });

  if (verificationError) {
    throw new Error(
      'The current password is incorrect.',
    );
  }

  // Update the authenticated account password.
  const { error: updateError } =
    await supabase.auth.updateUser({
      password: input.newPassword,
    });

  if (updateError) {
    throw new Error(updateError.message);
  }
},

  async changeEmail(
    newEmail: string,
  ): Promise<void> {
    const cleanEmail = newEmail
      .trim()
      .toLowerCase();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error(
        userError?.message ||
          'Unable to identify the administrator.',
      );
    }

    if (user.email === cleanEmail) {
      return;
    }

    const { error } =
      await supabase.auth.updateUser({
        email: cleanEmail,
      });

    if (error) {
      throw new Error(error.message);
    }
  },
};