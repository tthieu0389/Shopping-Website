const { z } = require("zod");

exports.createStoreSchema = z.object({
  name: z.string().min(1),
  province: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
});

exports.updateStoreSchema = z.object({
  name: z.string().optional(),
  province: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});
