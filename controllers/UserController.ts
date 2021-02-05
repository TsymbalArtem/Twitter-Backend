import express from 'express';
import mangoose from 'mongoose';
import { validationResult } from 'express-validator';
import { UserModel, IUserModel } from '../models/UserModel';
import { generateMD5 } from '../utils/generateHash';
import { sendEmail } from '../utils/sendEmail';

const isValidObjectId = mangoose.Types.ObjectId.isValid;

class UserController {
  async index(_: any, res: express.Response): Promise<void> {
    try {
      const users = await UserModel.find({}).exec();

      res.json({
        status: 'success',
        data: users,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }

  async show(req: express.Request, res: express.Response) {
    try {
      const userId = req.params.id;

      const user = await UserModel.findById(userId).exec();

      if (!isValidObjectId(userId)) {
        res.status(400).send();
        return;
      }

      if (!user) {
        res.status(404).send();
        return;
      }
      res.json({
        status: 'succsess',
        data: user,
      });
    }
    catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }

  async create(req: express.Request, res: express.Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ status: 'error', errors: errors.array() });
        return;
      }

      const data: IUserModel = {
        email: req.body.email,
        username: req.body.username,
        fullname: req.body.fullname,
        password: generateMD5(req.body.password + process.env.SECRET_KEY),
        confirmHash: generateMD5(process.env.SECRET_KEY || Math.random().toString()),
      };

      const user = await UserModel.create(data);

      sendEmail(
        {
          emailFrom: 'admin@twitter.com',
          emailTo: data.email,
          subject: 'Подтверждение почты Twitter Clone',
          html: `Для того, чтобы подтвердить почту, перейдите <a href="http://localhost:${process.env.PORT || 8888
            }/users/verify?hash=${data.confirmHash}">по этой ссылке</a>`,
        },
        (err: Error | null) => {
          if (err) {
            res.status(500).json({
              status: 'error',
              message: err,
            });
          } else {
            res.status(201).json({
              status: 'success',
              data: user,
            });
          }
        },
      );
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }

  async verify(req: any, res: express.Response): Promise<void> {
    try {
      const hash = req.query.hash;

      if (!hash) {
        res.status(400).send();
        return;
      }

      const user = await UserModel.findOne({ confirmHash: hash }).exec();

      if (user) {
        user.confirmed = true;
        user.save();

        res.json({
          status: 'success',
        });
      } else {
        res.status(404).json({ status: 'error', message: 'Пользователь не найден' });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }
}

export const UserCtrl = new UserController();