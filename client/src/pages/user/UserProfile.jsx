import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ProfileEditor from "../../components/common/ProfileEditor";

const UserProfile = () => {
  const { user, setUser } = useAuth();

  const handleUpdate = (updated) => {
    if (typeof setUser === "function") setUser((prev) => ({ ...prev, ...updated }));
  };

  return (
    <DashboardLayout>
      <ProfileEditor user={user} onUpdate={handleUpdate} />
    </DashboardLayout>
  );
};

export default UserProfile;
