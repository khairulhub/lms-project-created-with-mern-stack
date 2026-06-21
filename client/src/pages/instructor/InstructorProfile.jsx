import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ProfileEditor from "../../components/common/ProfileEditor";

const InstructorProfile = () => {
  const { user } = useAuth();
  return (
    <DashboardLayout>
      <ProfileEditor user={user} />
    </DashboardLayout>
  );
};

export default InstructorProfile;
