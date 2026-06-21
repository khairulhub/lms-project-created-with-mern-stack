import React from 'react';

const CourseVideoSection = () => {
    return (
          <section style={{ background: "#120326" }} className="py-16 px-4">
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-3">
        কোর্সের একটু আভাস নাও
      </h2>
      <p className="text-gray-400 text-center text-sm mb-8">ফ্রি প্রিভিউতে দেখো আমরা কীভাবে পড়াই</p>
      <div className="relative w-full rounded-2xl overflow-hidden border border-purple-800" style={{ aspectRatio: "16/9", background: "#0d011f" }}>
        <iframe
          src="https://www.youtube.com/embed/BHLtpPD_VBA?si=UDnIuAr-Of1xFfrh"
          title="Course Preview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  </section>
    );
}

export default CourseVideoSection;