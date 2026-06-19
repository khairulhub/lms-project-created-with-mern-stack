import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ProfileEditor from "../../components/common/ProfileEditor";

const UserProfile = () => {
  const { user, setUser } = useAuth();
  // AuthContext doesn't expose setUser directly, so we reload via window or pass a callback
  const handleUpdate = (updated) => {
    // Update localStorage if needed; page will reflect via re-fetch on next load
  };

  return (
    <DashboardLayout>
      <ProfileEditor user={user} onUpdate={handleUpdate} />
    </DashboardLayout>
  );
};

export default UserProfile;
