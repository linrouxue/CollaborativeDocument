import request from "@/lib/api/axios";

interface LoginParams {
    username: string;
    password: string;
}

export const login = async (params: LoginParams) => {
    try {
        const res = await request.post("/login", params);
        return res;
    } catch (error) {
        throw error;
    }
}