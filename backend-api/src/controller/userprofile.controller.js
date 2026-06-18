const userProfileService = require("../services/userprofile.service");

// Create or update user profile
exports.createOrUpdateProfile = async (req, res, next) => {
  try {
    // Fallback to token userId if route param is missing
    const userId = req.params.userId || req.user.id;

    const profile = await userProfileService.createOrUpdateProfile(
      userId,
      req.body,
    );

    res.json({
      message: "Profile saved",
      data: profile,
    });
  } catch (err) {
    next(err);
  }
};

// Get profile by userId
exports.getProfileByUserId = async (req, res, next) => {
  try {
    // Fallback to token userId if route param is missing
    const userId = req.params.userId || req.user.id;

    const profile = await userProfileService.getProfileByUserId(userId);
    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
};

// Delete profile
exports.deleteProfile = async (req, res, next) => {
  try {
    // Fallback to token userId if route param is missing
    const userId = req.params.userId || req.user.id;

    await userProfileService.deleteProfile(userId);
    res.json({ message: "Profile deleted" });
  } catch (err) {
    next(err);
  }
};
