import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ProfileEditor from "../../components/common/ProfileEditor";

const AdminProfile = () => {
  const { user } = useAuth();
  return (
    <DashboardLayout>
      <ProfileEditor user={user} />
    </DashboardLayout>
  );
};

export default AdminProfile;
