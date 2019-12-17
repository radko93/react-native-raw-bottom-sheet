import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  View,
  KeyboardAvoidingView,
  Modal,
  TouchableOpacity,
  Animated,
  PanResponder,
  Platform
} from "react-native";
import styles from "./style";

const SUPPORTED_ORIENTATIONS = [
  "portrait",
  "portrait-upside-down",
  "landscape",
  "landscape-left",
  "landscape-right"
];

class RBSheet extends Component {
  constructor(props) {
    super(props);

    this.animatedHeight = new Animated.Value(props.height)

    this.state = {
      modalVisible: false,
      pan: new Animated.ValueXY()
    };

    this.createPanResponder(props);
  }

  setModalVisible(visible) {
    const { height, minClosingHeight, duration, onClose } = this.props;
    const { pan } = this.state;
    const { animatedHeight } = this;
    if (visible) {
      this.setState({ modalVisible: visible });
    } else {
      Animated.timing(animatedHeight, {
        toValue: height,
        duration,
        useNativeDriver: true
      }).start(() => {
        pan.setValue({ x: 0, y: 0 });
        this.animatedHeight.setValue(height)
        this.setState({
          modalVisible: visible,
        });
        if (typeof onClose === "function") onClose();
      });
    }
  }

  openBottomSheet({ animatedHeight, duration }) {
    Animated.timing(animatedHeight, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }).start();
  }

  createPanResponder(props) {
    const { closeOnDragDown, height } = props;
    const { animatedHeight } = this;
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => closeOnDragDown,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dy > 0) {
          Animated.event([null, { dy: animatedHeight }])(e, gestureState);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (height / 2.5 - gestureState.dy < 0) {
          this.setModalVisible(false);
        } else {
          Animated.spring(animatedHeight, {
            toValue: 0,
            useNativeDriver: true
          }).start();
        }
      }
    });
  }

  open() {
    this.setModalVisible(true);
  }

  close() {
    this.setModalVisible(false);
  }

  render() {
    const { animationType, closeOnPressBack, closeOnPressMask, children, customStyles, duration } = this.props;
    const { pan, modalVisible } = this.state;
    const { animatedHeight } = this;
    const panStyle = {
      transform: pan.getTranslateTransform()
    };

    return (
      <Modal
        transparent
        animationType={animationType}
        visible={modalVisible}
        onShow={() => this.openBottomSheet({ animatedHeight, duration })}
        supportedOrientations={SUPPORTED_ORIENTATIONS}
        onRequestClose={() => {
          if (closeOnPressBack) this.setModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          enabled={Platform.OS === "ios"}
          behavior="padding"
          style={[styles.wrapper, customStyles.wrapper]}
        >
          <TouchableOpacity
            style={styles.mask}
            activeOpacity={1}
            onPress={() => (closeOnPressMask ? this.close() : null)}
          />
          <Animated.View
            {...this.panResponder.panHandlers}
            style={[styles.container, customStyles.container, {
              height: this.props.height,
              transform: [
                { translateY: animatedHeight }
              ]
            }]}
          >
            {closeOnDragDown && (
              <View style={styles.draggableContainer}>
                <View style={[styles.draggableIcon, customStyles.draggableIcon]} />
              </View>
            )}
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
}

RBSheet.propTypes = {
  animationType: PropTypes.oneOf(["none", "slide", "fade"]),
  height: PropTypes.number,
  minClosingHeight: PropTypes.number,
  duration: PropTypes.number,
  closeOnDragDown: PropTypes.bool,
  closeOnPressMask: PropTypes.bool,
  closeOnPressBack: PropTypes.bool,
  customStyles: PropTypes.objectOf(PropTypes.object),
  onClose: PropTypes.func,
  children: PropTypes.node
};

RBSheet.defaultProps = {
  animationType: "fade",
  height: 260,
  minClosingHeight: 0,
  duration: 300,
  closeOnDragDown: true,
  closeOnPressMask: true,
  closeOnPressBack: true,
  customStyles: {},
  onClose: null,
  children: <View />
};

export default RBSheet;
