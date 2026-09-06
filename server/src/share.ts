import { Router } from "express";
import crypto from "node:crypto";
import type { Response, Request } from "express";
import { getSessionUser } from "./auth.js";

/**
 * Поделиться в соцсетях.
 *
 * Instagram Stories-картинка генерируется на клиенте (canvas 1080×1920),
 * здесь — мок endpoint, который принимает описание и помечает публикацию.
 * VK-пост публикуется через VK API (status.methods.photos/wall.post);
 * в демо возвращаем ссылку на предпросмотр поста.
 */

interface SharePost {
  id: string;
  userId: string;
  social: "instagram" | "vk";
  text: string;
  url?: string;
  at: string;
}

const shared = new Map<string, SharePost>();

const requireSession = (req: Request, res: Response): ReturnType<typeof getSessionUser> => {
  const user = getSessionUser(req);
  if (!user) res.status(401).json({ error: "Не авторизован" });
  return user;
};

const router = Router();

/** Опубликовать Stories-картинку в Instagram (метаданные + URL изображения) */
router.post("/instagram", (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;
  const { caption, image_url: imageUrl } = req.body ?? {};
  if (!imageUrl) return void res.status(400).json({ error: "Передайте image_url сгенерированной картинки" });
  const id = crypto.randomBytes(6).toString("hex");
  const rec: SharePost = {
    id,
    userId: user.id,
    social: "instagram",
    text: String(caption ?? ""),
    url: String(imageUrl),
    at: new Date().toISOString(),
  };
  shared.set(id, rec);
  // В проде тут шёл бы загрузка в Instagram Graph API
  res.json({ post_id: id, social: "instagram", status: "queued", hint: "Картинку в Stories загружает пользователь через приложение Instagram" });
});

/** Опубликовать пост в VK */
router.post("/vk", (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;
  const { text, image_url: imageUrl } = req.body ?? {};
  const id = crypto.randomBytes(6).toString("hex");
  const rec: SharePost = {
    id,
    userId: user.id,
    social: "vk",
    text: String(text ?? ""),
    url: String(imageUrl ?? ""),
    at: new Date().toISOString(),
  };
  shared.set(id, rec);
  res.json({
    post_id: id,
    social: "vk",
    status: "published",
    post_url: `https://vk.com/wall-${user.id}?w=wall-${user.id}_${shared.size}`,
  });
});

/** Список публикаций текущего пользователя */
router.get("/my", (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;
  const mine = [...shared.values()].filter((s) => s.userId === user.id).reverse();
  res.json(mine);
});

export default router;