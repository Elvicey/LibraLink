import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import ProfileScreen from "../../components/profile/ProfileScreen";
import { useAuth } from "../../contexts/AuthContext";
import { borrowsService } from "../../services/borrows";
import { reservationsService } from "../../services/reservations";
import { usersService } from "../../services/users";

function initialsFromName(firstName?: string | null, lastName?: string | null): string | null {
  const first = (firstName || "").trim();
  const last = (lastName || "").trim();
  if (!first && !last) return null;
  if (first && last) return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  return first.charAt(0).toUpperCase();
}

export default function Profile() {
  const router = useRouter();
  const { userId, firstName, lastName, email, roles, clearSession, setSession, token } = useAuth();

  const [displayFirstName, setDisplayFirstName] = useState(firstName);
  const [displayLastName, setDisplayLastName] = useState(lastName);
  const [displayEmail, setDisplayEmail] = useState(email);
  const [institutionName, setInstitutionName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [indexNumber, setIndexNumber] = useState<string | null>(null);
  const [programme, setProgramme] = useState<string | null>(null);
  const [booksBorrowed, setBooksBorrowed] = useState(0);
  const [activeHolds, setActiveHolds] = useState(0);

  const load = useCallback(async () => {
    if (!userId || !token) return;
    try {
      const [user, history, pickups] = await Promise.all([
        usersService.getById(userId).catch(() => null),
        borrowsService.getHistory(userId).catch(() => []),
        reservationsService.getPickupsForUser(userId).catch(() => []),
      ]);

      if (user) {
        setDisplayFirstName(user.firstName ?? null);
        setDisplayLastName(user.lastName ?? null);
        setDisplayEmail(user.email ?? null);
        setInstitutionName(user.institution?.name ?? null);
        setPhone(user.phoneNumber ?? null);
        setStudentId(user.studentId ?? null);
        setIndexNumber(user.indexNumber ?? null);
        setProgramme(user.programme ?? null);
        await setSession({
          token,
          userId,
          roles,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          institutionId: user.institutionId ?? null,
        });
      }

      setBooksBorrowed(history.length);
      const openPickups = pickups.filter((p) => {
        const status = (p.status || "").toUpperCase();
        return status !== "CANCELLED" && status !== "COMPLETED" && status !== "DONE";
      });
      setActiveHolds(openPickups.length);
    } catch {
      // keep cached auth values
    }
  }, [userId, token, roles, setSession]);

  useEffect(() => {
    if (firstName) setDisplayFirstName(firstName);
    if (lastName) setDisplayLastName(lastName);
    if (email) setDisplayEmail(email);
    load();
  }, [firstName, lastName, email, load]);

  // The tab stays mounted, so refetch whenever it regains focus (e.g. returning from the
  // edit screen) to reflect newly-saved phone / student details.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const fullName = [displayFirstName, displayLastName].filter(Boolean).join(" ").trim();
  const isPopulated = Boolean(fullName || displayEmail);

  return (
    <ProfileScreen
      isPopulated={isPopulated}
      user={{
        name: fullName || "No name set",
        initials: initialsFromName(displayFirstName, displayLastName),
        role: "Student",
        emailVerified: Boolean(displayEmail),
        booksBorrowed: isPopulated ? booksBorrowed : "-",
        activeHolds: isPopulated ? activeHolds : "-",
        daysActive: "-",
        email: displayEmail || "Not set",
        phone: phone || "Not set",
        studentId: studentId || "Not set",
        programme: programme || "Not set",
        indexNumber: indexNumber || "Not set",
        institution: institutionName || "Not linked",
        lastPasswordChange: "Update your credentials",
      }}
      onEditProfile={() => router.push("/profile-details" as any)}
      onChangePassword={() => router.push("/change-password" as any)}
      onLogout={async () => {
        await clearSession();
        router.replace("/signin" as any);
      }}
    />
  );
}
