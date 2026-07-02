import type { Request, Response } from "express";

import { BadRequestError, ForbiddenError, NotFoundError } from "./errors.js";
import { respondWithJSON } from "./json.js";
import {
  type ChirpSortOrder,
  createChirp,
  deleteChirp,
  getAllChirps,
  getChirpById,
} from "../db/queries/chirps.js";
import { getBearerToken, validateJWT } from "../auth.js";
import { config } from "../config.js";

const badWords = ["kerfuffle", "sharbert", "fornax"];
const maxChirpLength = 140;

type CreateChirpBody = {
  body: string;
};

export async function handlerCreateChirp(req: Request, res: Response) {
  const body = req.body as CreateChirpBody;

  if (!body?.body || typeof body.body !== "string") {
    throw new BadRequestError("Body is required");
  }

  if (body.body.length > maxChirpLength) {
    throw new BadRequestError("Chirp is too long. Max length is 140");
  }

  const token = getBearerToken(req);
  const userId = validateJWT(token, config.auth.jwtSecret);

  const words = body.body.split(" ");
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const loweredWord = word.toLowerCase();
    if (badWords.includes(loweredWord)) {
      words[i] = "****";
    }
  }

  const cleanedBody = words.join(" ");

  const createdChirp = await createChirp({
    body: cleanedBody,
    userId,
  });

  respondWithJSON(res, 201, createdChirp);
}

export async function handlerGetAllChirps(req: Request, res: Response) {
  const authorId = req.query.authorId;
  const sortQuery = req.query.sort;

  if (authorId !== undefined && typeof authorId !== "string") {
    throw new BadRequestError("Author ID must be a string");
  }

  if (sortQuery !== undefined && typeof sortQuery !== "string") {
    throw new BadRequestError("Sort must be asc or desc");
  }

  if (sortQuery !== undefined && sortQuery !== "asc" && sortQuery !== "desc") {
    throw new BadRequestError("Sort must be asc or desc");
  }

  const sort: ChirpSortOrder = sortQuery ?? "asc";
  const chirps = await getAllChirps(authorId, sort);
  respondWithJSON(res, 200, chirps);
}

export async function handlerGetChirpById(req: Request, res: Response) {
  const chirpId = req.params.chirpId;

  if (!chirpId || typeof chirpId !== "string") {
    throw new BadRequestError("Chirp ID is required");
  }

  const chirp = await getChirpById(chirpId);
  if (!chirp) {
    throw new NotFoundError("Chirp not found");
  }

  respondWithJSON(res, 200, chirp);
}

export async function handlerDeleteChirp(req: Request, res: Response) {
  const chirpId = req.params.chirpId;

  if (!chirpId || typeof chirpId !== "string") {
    throw new BadRequestError("Chirp ID is required");
  }

  const token = getBearerToken(req);
  const userId = validateJWT(token, config.auth.jwtSecret);

  const chirp = await getChirpById(chirpId);
  if (!chirp) {
    throw new NotFoundError("Chirp not found");
  }

  if (chirp.userId !== userId) {
    throw new ForbiddenError("You are not allowed to delete this chirp");
  }

  await deleteChirp(chirpId);
  res.status(204).send();
}
