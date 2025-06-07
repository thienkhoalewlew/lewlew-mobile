import * as ImagePicker from 'expo-image-picker';
import { CLOUDINARY_CONFIG } from '../config/env';

/**
 * Chọn hình ảnh từ thư viện thiết bị
 * @returns Promise với URI hình ảnh đã chọn hoặc null nếu hủy
 */
export const pickImage = async (): Promise<string | null> => {
  try {
    // Yêu cầu quyền truy cập thư viện ảnh
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      console.error('Quyền truy cập thư viện phương tiện bị từ chối');
      return null;
    }

    // Mở trình chọn hình ảnh
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    
    return null;
  } catch (error) {
    console.error('Lỗi khi chọn hình ảnh:', error);
    return null;
  }
};

/**
 * Tải hình ảnh lên Cloudinary
 * @param uri URI cục bộ của hình ảnh cần tải lên
 * @param folder Thư mục trên Cloudinary để lưu ảnh
 * @returns Promise với URL tải xuống của hình ảnh đã tải lên
 */

export const uploadImageToCloudinary = async (uri: string, folder: string): Promise<string | null> => {
  try {

    const fileExtension = uri.split('.').pop() || 'jpg';
    const fileName = `image.${fileExtension}`;
    
    let mimeType;
    switch (fileExtension.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'gif':
        mimeType = 'image/gif';
        break;
      default:
        mimeType = 'image/jpeg';
    }
    
    const source = {
      uri: uri,
      type: mimeType,
      name: fileName
    };
      // Tạo FormData cho request
    const formData = new FormData();
    // @ts-ignore
    formData.append('file', source);
    formData.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);
    formData.append('folder', folder);

    // Gửi yêu cầu tải lên
    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.CLOUD_NAME}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data'
      }
    });

    const data = await uploadResponse.json();
    
    if (data.secure_url) {
      return data.secure_url;
    } else {
      console.error('Lỗi tải lên Cloudinary:', data);
      return null;
    }
  } catch (error) {
    console.error('Lỗi khi tải lên Cloudinary:', error);
    return null;
  }
};

export const uploadUserAvatar = async (localUri: string, userId: string): Promise<string | null> => {
  try {
    // Tải hình ảnh lên Cloudinary
    const cloudinaryUrl = await uploadImageToCloudinary(localUri, `${CLOUDINARY_CONFIG.FOLDER}/${userId}`);
    
    if (cloudinaryUrl) {
      return cloudinaryUrl;
    } else {
      console.error('Lỗi tải lên Cloudinary');
      return null;
    }
  } catch (error) {
    console.error('Lỗi khi tải lên avatar:', error);
    return null;
  }
}

export const uploadPostImage = async (localUri: string): Promise<string | null> => {
  try {
    // Tải hình ảnh lên Cloudinary
    const cloudinaryUrl = await uploadImageToCloudinary(localUri, `${CLOUDINARY_CONFIG.FOLDER}/post`);
    
    if (cloudinaryUrl) {
      return cloudinaryUrl;
    } else {
      console.error('Lỗi tải lên Cloudinary');
      return null;
    }
  } catch (error) {
    console.error('Lỗi khi tải lên hình ảnh bài đăng:', error);
    return null;
  }
}