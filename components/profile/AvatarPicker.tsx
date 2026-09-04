import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { radii } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import * as workplacesRepo from '@/services/repositories/workplacesRepo';
import { Icon } from '@/components/Icon';

type Props = {
  uri?: string;
  size?: number;
};

/** Tap to pick a photo from the library and set it as the profile picture.
 * Local-store only for now — see workplacesRepo.updateAvatar's doc comment. */
export function AvatarPicker({ uri, size = 96 }: Props) {
  const { user, refreshUser } = useAuth();
  const [busy, setBusy] = useState(false);

  async function pick() {
    if (!user || busy) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    setBusy(true);
    try {
      await workplacesRepo.updateAvatar(user.id, result.assets[0].uri);
      await refreshUser();
    } catch (err) {
      Alert.alert('Could not update photo', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable
      onPress={pick}
      disabled={busy}
      accessibilityLabel="Change profile picture"
      style={[styles.wrapper, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <Icon name="person" size={size * 0.42} color={palette.primary} />
      )}
      <View style={styles.badge}>
        {busy ? (
          <ActivityIndicator size="small" color={palette.onPrimary} />
        ) : (
          <Icon name="photo_camera" size={16} color={palette.onPrimary} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'rgba(53, 37, 205, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.surface,
  },
});
