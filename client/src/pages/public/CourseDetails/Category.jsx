import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight, FiCalendar, FiUser,
  FiCheck, FiChevronDown, FiChevronUp, FiStar,
  FiPlay, FiThumbsUp,
} from "react-icons/fi";

const Category = ({loadingCats, categories}) => {
    return (
         <section className="py-20 px-4" style={{ background: "#0d011f" }}>
                <div className="max-w-7xl mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Browse Categories</h2>
                    <p className="text-gray-400">Explore content by topic</p>
                  </div>
        
                  {loadingCats ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {categories.map((cat) => (
                        <Link
                          key={cat._id}
                          to={`/categories/${cat.slug}`}
                          className="group bg-gray-900 border border-gray-800 hover:border-cyan-500/40 rounded-xl p-5 text-center transition-all hover:bg-gray-800/60"
                        >
                          <div className="text-4xl mb-3">{cat.icon}</div>
                          <div className="text-white font-semibold text-sm group-hover:text-cyan-400 transition-colors">{cat.name}</div>
                          {cat.description && (
                            <div className="text-gray-500 text-xs mt-1 line-clamp-2">{cat.description}</div>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
        
                
                </div>
              </section>
    );
}

export default Category;