package com.edtech.web.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;

@Service
@Slf4j
public class OssService {

    @Value("${oss.endpoint}")
    private String endpoint;

    @Value("${oss.access-key-id}")
    private String accessKeyId;

    @Value("${oss.access-key-secret}")
    private String accessKeySecret;

    @Value("${oss.bucket-name}")
    private String bucketName;

    @Value("${oss.url-prefix}")
    private String urlPrefix;

    public String uploadAvatar(MultipartFile file, Long userId) {
        String originalFilename = file.getOriginalFilename();
        String ext = (originalFilename != null && originalFilename.contains("."))
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
        String objectKey = "avatars/" + userId + "/" + UUID.randomUUID() + ext;

        OSS ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);
        try (InputStream is = file.getInputStream()) {
            ossClient.putObject(bucketName, objectKey, is);
            String url = urlPrefix + "/" + objectKey;
            log.info("Avatar uploaded for user {}: {}", userId, url);
            return url;
        } catch (Exception e) {
            log.error("OSS upload failed for user {}", userId, e);
            throw new RuntimeException("头像上传失败：" + e.getMessage());
        } finally {
            ossClient.shutdown();
        }
    }
}
