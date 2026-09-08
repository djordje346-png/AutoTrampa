'use client';

import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { BottomSheet } from '@/components/BottomSheet';
import { useUser, shortName, type UserProfile } from '@/hooks/use-user';
import { useGarage } from '@/hooks/use-garage';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s/-]{6,}$/;

type Field = 'name' | 'email' | 'phone' | 'city';

interface ProfileEditSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileEditSheet({ open, onClose }: ProfileEditSheetProps) {
  const { user, updateUser } = useUser();
  const { cars, updateCar } = useGarage();
  const [draft, setDraft] = useState<UserProfile>(user);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  useEffect(() => {
    if (open) {
      setDraft(user);
      setErrors({});
    }
  }, [open, user]);

  function validate(): Partial<Record<Field, string>> {
    const next: Partial<Record<Field, string>> = {};
    if (draft.name.trim().length < 3) next.name = 'Unesi ime i prezime.';
    if (draft.email.trim() && !EMAIL_RE.test(draft.email.trim())) {
      next.email = 'Email nije ispravan.';
    }
    if (draft.phone.trim() && !PHONE_RE.test(draft.phone.trim())) {
      next.phone = 'Broj telefona nije ispravan.';
    }
    if (!draft.email.trim() && !draft.phone.trim()) {
      next.email = 'Ostavi bar email ili broj telefona.';
    }
    return next;
  }

  function save() {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const cleaned: Partial<UserProfile> = {
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      city: draft.city.trim(),
    };

    const result = updateUser(cleaned);
    if (!result.ok) {
      toast.error('Profil nije sačuvan.');
      return;
    }

    // Garage cars carry the owner's details onto their listing, so they have to
    // follow the profile rather than keep whatever was true when they were added.
    cars.forEach((car) => {
      updateCar({
        ...car,
        owner: {
          ...car.owner,
          name: shortName(cleaned.name!),
          phone: cleaned.phone!,
          city: cleaned.city || car.owner.city,
        },
      });
    });

    toast.success('Profil sačuvan.');
    onClose();
  }

  const inputBase =
    'h-11 w-full rounded-xl border bg-elevated px-3.5 text-sm text-app-primary outline-none transition-all placeholder:text-app-muted focus:ring-2 focus:ring-orange-500/10';
  const ok = 'border-surface hover:border-orange-500/40 focus:border-orange-500';
  const bad = 'border-rose-500/70 focus:border-rose-500';

  const fields: { key: Field; label: string; placeholder: string; type?: string }[] = [
    { key: 'name', label: 'Ime i prezime', placeholder: 'Nikola Vukovic' },
    { key: 'email', label: 'Email', placeholder: 'nikola@example.com', type: 'email' },
    { key: 'phone', label: 'Telefon', placeholder: '+381 64 123 4567', type: 'tel' },
    { key: 'city', label: 'Grad', placeholder: 'Kosovska Mitrovica' },
  ];

  return (
    <BottomSheet open={open} onClose={onClose} title="Uredi profil">
      <div className="space-y-4">
        {fields.map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label htmlFor={`profile-${key}`} className="mb-2 block text-xs font-medium text-app-muted">
              {label}
            </label>
            <input
              id={`profile-${key}`}
              type={type ?? 'text'}
              value={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              placeholder={placeholder}
              aria-invalid={Boolean(errors[key])}
              className={`${inputBase} ${errors[key] ? bad : ok}`}
            />
            {errors[key] && (
              <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-400">
                <TriangleAlert size={12} className="flex-shrink-0" />
                {errors[key]}
              </p>
            )}
          </div>
        ))}

        <p className="text-[11px] leading-relaxed text-app-muted">
          Ime i telefon se prikazuju na tvojim oglasima kao {shortName(draft.name || 'Korisnik')}.
        </p>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-elevated py-3 text-sm font-semibold text-app-primary transition-colors hover:bg-hover-surface"
          >
            Otkaži
          </button>
          <button
            onClick={save}
            className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-400"
          >
            Sačuvaj
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
