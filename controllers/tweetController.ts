/* eslint-disable class-methods-use-this */
import express from 'express';
import { validationResult } from 'express-validator';
import { ITweetModel, TweetModel } from '../models/TweetModel';
import { IUserModel } from '../models/userModel';
import isValidObjectId from '../utils/isValidObjectId';

class TweetController {
  async get(_req: express.Request, res: express.Response): Promise<void> {
    try {
      const tweets = await TweetModel.find({}).populate('user').exec();

      res.json({
        status: 'success',
        data: tweets,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }

  async getById(req: express.Request, res: express.Response): Promise<void> {
    try {
      const tweetId = req.params.id;

      if (!isValidObjectId(tweetId)) {
        res.status(400).send();
        return;
      }

      const tweet = await TweetModel.findById(tweetId).populate('user').exec();

      if (!tweet) {
        res.status(404).send();
        return;
      }

      res.json({
        status: 'success',
        data: tweet,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }

  async create(req: express.Request, res: express.Response): Promise<void> {
    try {
      const user = req.user as IUserModel;

      if (user?._id) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
          res.status(400).json({ status: 'error', errors: errors.array() });
          return;
        }

        const data: ITweetModel = {
          text: req.body.text,
          user: user._id,
        };

        const tweet = await TweetModel.create(data);

        res.json({
          status: 'success',
          data: tweet,
        });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }

  async update(req: express.Request, res: express.Response): Promise<void> {
    const user = req.user as IUserModel;

    try {
      if (user) {
        const tweetId = req.params.id;

        if (!isValidObjectId(tweetId)) {
          res.status(400).send();
          return;
        }

        const tweet = await TweetModel.findById(tweetId);

        if (tweet && typeof tweet.user === 'object') {
          if (String(tweet.user._id) === String(user._id)) {
            const { text } = req.body;
            tweet.text = text;
            tweet.save();
            res.send();
          } else {
            res.status(403).send();
          }
        } else {
          res.status(404).send();
        }
      }

    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }

  async delete(req: express.Request, res: express.Response): Promise<void> {
    const user = req.user as IUserModel;

    try {
      if (user) {
        const tweetId = req.params.id;

        if (!isValidObjectId(tweetId)) {
          res.status(400).send();
          return;
        }

        const tweet = await TweetModel.findById(tweetId);

        if (tweet && typeof tweet.user === 'object') {
          if (String(tweet.user._id) === String(user._id)) {
            tweet.remove();
            res.send();
          } else {
            res.status(403).send();
          }
        } else {
          res.status(404).send();
        }
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }
}

export default new TweetController();