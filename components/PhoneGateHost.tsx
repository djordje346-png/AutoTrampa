'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePhoneGate } from '@/hooks/use-phone-gate';
import { useUser } from '@/hooks/use-user';
import PhoneGateModal from '@/components/PhoneGateModal';

export default function PhoneGateHost() {
  const { user } = useAuth();
  const { user: profile, profileReady, profileError, reloadProfile } = useUser();
  const { pending, cancelPhoneAction, resumePhoneAction } = usePhoneGate();
  const profileMatchesSession = Boolean(user && profile.id === user.id);
  const profileChecked = Boolean(user && profileMatchesSession && profileReady);
  const profileFailed = Boolean(user && profileMatchesSession && profileError);
  const hasPhone = Boolean(profile.phone.trim());

  useEffect(() => {
    if (pending && profileChecked && hasPhone) resumePhoneAction();
  }, [pending, profileChecked, hasPhone, resumePhoneAction]);

  return (
    <PhoneGateModal
      open={pending && ((profileChecked && !hasPhone) || profileFailed)}
      loadError={profileFailed ? profileError : ''}
      onRetry={reloadProfile}
      onCancel={cancelPhoneAction}
      onContinue={resumePhoneAction}
    />
  );
}
