import axios from "axios";

const API_URL = "http://localhost:5000/api/categories";

export const getCategories = () => axios.get(API_URL);
export const getCategory = (id) => axios.get(`${API_URL}/${id}`);
export const createCategory = (name) => axios.post(API_URL, { name });



