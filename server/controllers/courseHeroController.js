const asyncHandler = require("express-async-handler");
const CourseHeroSection = require("../models/CourseHeroSection");

// GET /api/course-hero — public, returns the single hero-section doc
// (auto-creates with defaults the first time, so it always returns something)
const getCourseHero = asyncHandler(async (req, res) => {
  let hero = await CourseHeroSection.findOne();
  if (!hero) hero = await CourseHeroSection.create({});
  res.json(hero);
});

// PUT /api/admin/course-hero — admin update of the single hero-section doc
const updateCourseHero = asyncHandler(async (req, res) => {
  let hero = await CourseHeroSection.findOne();
  if (!hero) hero = await CourseHeroSection.create({});

  const {
    badgeText, headingHtml, description, stats,
    primaryButtonText, primaryButtonLink, secondaryButtonText, secondaryButtonLink, guaranteeText,
    showInstructorCard, instructorImage, instructorName, instructorTitle,
    instructorSubtitle, bestsellerBadgeText, jobSupportBadgeText,
  } = req.body;

  if (badgeText !== undefined) hero.badgeText = badgeText;
  if (headingHtml !== undefined) hero.headingHtml = headingHtml;
  if (description !== undefined) hero.description = description;
  if (stats !== undefined) hero.stats = stats;
  if (primaryButtonText !== undefined) hero.primaryButtonText = primaryButtonText;
  if (primaryButtonLink !== undefined) hero.primaryButtonLink = primaryButtonLink;
  if (secondaryButtonText !== undefined) hero.secondaryButtonText = secondaryButtonText;
  if (secondaryButtonLink !== undefined) hero.secondaryButtonLink = secondaryButtonLink;
  if (guaranteeText !== undefined) hero.guaranteeText = guaranteeText;
  if (showInstructorCard !== undefined) hero.showInstructorCard = showInstructorCard;
  if (instructorImage !== undefined) hero.instructorImage = instructorImage;
  if (instructorName !== undefined) hero.instructorName = instructorName;
  if (instructorTitle !== undefined) hero.instructorTitle = instructorTitle;
  if (instructorSubtitle !== undefined) hero.instructorSubtitle = instructorSubtitle;
  if (bestsellerBadgeText !== undefined) hero.bestsellerBadgeText = bestsellerBadgeText;
  if (jobSupportBadgeText !== undefined) hero.jobSupportBadgeText = jobSupportBadgeText;

  const updated = await hero.save();
  res.json(updated);
});

module.exports = { getCourseHero, updateCourseHero };
