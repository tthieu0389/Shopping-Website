const userProfileService = require("../services/userprofile.service");

exports.createOrUpdateProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId;
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

exports.getProfileByUserId = async (req, res, next) => {
  try {
    const profile = await userProfileService.getProfileByUserId(
      req.params.userId,
    );
    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
};

exports.deleteProfile = async (req, res, next) => {
  try {
    await userProfileService.deleteProfile(req.params.userId);
    res.json({ message: "Profile deleted" });
  } catch (err) {
    next(err);
  }
};
