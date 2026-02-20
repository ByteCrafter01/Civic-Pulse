const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

const prisma = new PrismaClient();

const generateTokens = (user) => {
    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    const refreshToken = jwt.sign({ id: user.id }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
    return { accessToken, refreshToken };
};

const register = async ({ name, email, password, role = 'CITIZEN', phone }) => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw { statusCode: 409, isOperational: true, message: 'Email already registered' };

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
        data: { name, email, password: hashed, role, phone },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return { user, ...generateTokens(user) };
};

const login = async ({ email, password }) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw { statusCode: 401, isOperational: true, message: 'Invalid credentials' };

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw { statusCode: 401, isOperational: true, message: 'Invalid credentials' };

    const { password: _, ...userSafe } = user;
    return { user: userSafe, ...generateTokens(userSafe) };
};

const refresh = async (refreshToken) => {
    try {
        const payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            select: { id: true, name: true, email: true, role: true, isActive: true },
        });
        if (!user || !user.isActive) throw new Error('User not found');
        const tokens = generateTokens(user);
        return tokens;
    } catch {
        throw { statusCode: 401, isOperational: true, message: 'Invalid or expired refresh token' };
    }
};

const getMe = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, phone: true, department: true, createdAt: true },
    });
    if (!user) throw { statusCode: 404, isOperational: true, message: 'User not found' };
    return user;
};

module.exports = { register, login, refresh, getMe };
