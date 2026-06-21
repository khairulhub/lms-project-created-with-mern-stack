import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";

const StudentSettings = () => {
  const { user } = useAuth();
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">StudentSettings</h1>
        <p className="text-gray-400 mb-8">Account and notification settings</p>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
          <p className="text-6xl mb-4">⚙️</p>
          <p className="text-white font-semibold mb-2">StudentSettings</p>
          <p className="text-gray-500 text-sm">This section is under development.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentSettings;
