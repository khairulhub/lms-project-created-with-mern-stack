import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../utils/api";
import PublicLayout from "../../components/layout/PublicLayout";
import { FiCheckCircle, FiXCircle, FiAward } from "react-icons/fi";

// Public, no-login verification page — employers or anyone with a
// certificate code can confirm it's real. URL: /verify-certificate/:certificateId
const VerifyCertificate = () => {
  const { certificateId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/certificates/verify/${certificateId}`)
      .then((res) => setResult(res.data))
      .catch((err) => setResult(err.response?.data || { valid: false, message: "Verify করতে সমস্যা হয়েছে।" }))
      .finally(() => setLoading(false));
  }, [certificateId]);

  return (
    <PublicLayout>
      <div className="max-w-lg mx-auto px-4 py-20">
        {loading ? (
          <div className="rounded-2xl border border-purple-800 p-8 text-center animate-pulse"
            style={{ background: "linear-gradient(135deg, #1a0533, #0d011f)" }}>
            <div className="h-12 w-12 bg-gray-700 rounded-full mx-auto mb-4" />
            <div className="h-4 bg-gray-700 rounded w-2/3 mx-auto" />
          </div>
        ) : result?.valid ? (
          <div className="rounded-2xl border border-green-500/30 p-8 text-center"
            style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.08), #0d011f)" }}>
            <FiCheckCircle className="text-green-400 mx-auto mb-4" size={48} />
            <h2 className="text-white font-bold text-xl mb-1">এই সার্টিফিকেট আসল</h2>
            <p className="text-gray-400 text-sm mb-6">This certificate is verified and authentic.</p>

            <div className="text-left bg-black/30 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <FiAward className="text-yellow-400 shrink-0" size={16} />
                <p className="text-white font-semibold">{result.studentName}</p>
              </div>
              <p className="text-gray-300 text-sm">{result.courseTitle}</p>
              <p className="text-gray-500 text-xs">
                Issued: {new Date(result.issuedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
              <p className="text-gray-600 text-xs font-mono">{result.certificateId}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-red-500/30 p-8 text-center"
            style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.08), #0d011f)" }}>
            <FiXCircle className="text-red-400 mx-auto mb-4" size={48} />
            <h2 className="text-white font-bold text-xl mb-1">Certificate পাওয়া যায়নি</h2>
            <p className="text-gray-400 text-sm">{result?.message || "এই কোডের কোনো certificate খুঁজে পাওয়া যায়নি।"}</p>
          </div>
        )}

        <p className="text-center mt-6">
          <Link to="/" className="text-cyan-400 hover:text-cyan-300 text-sm">← হোমপেজে ফিরে যাও</Link>
        </p>
      </div>
    </PublicLayout>
  );
};

export default VerifyCertificate;
