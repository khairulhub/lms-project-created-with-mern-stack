import React from 'react';

// Category cards on the home page. Instead of navigating to a separate page,
// clicking a category just selects it — the CourseHighlightsSection right
// below switches to show that category's data. `selectedSlug` controls which
// card is visually highlighted as active; `onSelect` is called with the
// clicked category's slug.
const Category = ({ loadingCats, categories, selectedSlug, onSelect }) => {
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
                      {categories.map((cat) => {
                        const isActive = cat.slug === selectedSlug;
                        return (
                          <button
                            key={cat._id}
                            type="button"
                            onClick={() => onSelect?.(cat.slug)}
                            className={`group bg-gray-900 border rounded-xl p-5 text-center transition-all hover:bg-gray-800/60 ${
                              isActive ? "border-cyan-500 bg-gray-800/60" : "border-gray-800 hover:border-cyan-500/40"
                            }`}
                          >
                            <div className="text-4xl mb-3">{cat.icon}</div>
                            <div className={`font-semibold text-sm transition-colors ${isActive ? "text-cyan-400" : "text-white group-hover:text-cyan-400"}`}>{cat.name}</div>
                            
                          </button>
                        );
                      })}
                    </div>
                  )}
        
                
                </div>
              </section>
    );
}

export default Category;