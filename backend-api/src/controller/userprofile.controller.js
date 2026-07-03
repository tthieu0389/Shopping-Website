const userProfileService = require("../services/userprofile.service");

// Upload avatar (multipart/form-data, field "avatar")
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image uploaded" });
    }

    const userId = req.params.userId || req.user.id;
    const url = `/public/uploads/avatars/${req.file.filename}`;

    const profile = await userProfileService.createOrUpdateProfile(userId, {
      avatar: url,
    });

    res.status(201).json({
      success: true,
      message: "Avatar uploaded",
      data: profile,
    });
  } catch (err) {
    next(err);
  }
};

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
