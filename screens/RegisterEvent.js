import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, StatusBar, TouchableOpacity, Modal } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, database } from '../config/firebase';
import { Image } from 'react-native';
const RegisterEvent = ({ route, navigation }) => {

    const { eventId, clubId } = route.params;

    console.log("received eventId : ", eventId)
    // console.log("clubId : ", clubId)


    const [role, setRole] = useState('');
    const [roleFetched, setRoleFetched] = useState(false);
    const [event, setEvent] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalVisibleClose, setModalVisibleClose] = useState(false);
    const [modalVisibleCompleted, setModalVisibleCompleted] = useState(false);

    const [isRegistered, setIsRegistered] = useState(false);
    const [forceRender, setForceRender] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);


    useEffect(() => {
        const checkRegistrationStatus = async () => {
            try {
                const currentUserUID = auth.currentUser.uid;
                const eventDocRef = doc(database, `clubs/${clubId}/events/${eventId}`);
                const eventDocSnapshot = await getDoc(eventDocRef);
                if (eventDocSnapshot.exists()) {
                    const eventData = eventDocSnapshot.data();
                    if (eventData.event_registered_members.includes(currentUserUID)) {
                        setIsRegistered(true);
                        console.log(currentUserUID, "--", eventData.event_registered_members.includes(currentUserUID))
                        console.log("already registered")
                    } else {
                        setIsRegistered(false);
                        console.log("not registered")

                    }
                } else {
                    console.error('Event document not found.');
                }
            } catch (error) {
                console.error('Error checking registration status:', error);
            }
        };

        checkRegistrationStatus();
    }, [clubId, eventId]);

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const eventDocRef = doc(database, `clubs/${clubId}/events/${eventId}`);
                const eventDocSnapshot = await getDoc(eventDocRef);

                if (eventDocSnapshot.exists()) {
                    const eventData = eventDocSnapshot.data();
                    setEvent(eventData);
                } else {
                    console.error('Event data not found.');
                }
            } catch (error) {
                console.error('Error fetching event data:', error);
            }
        };

        fetchEventDetails();
    }, [eventId]);



    useEffect(() => {

        const fetchRole = async () => {
            try {
                const currentUser = auth.currentUser;

                const userDocRef = doc(database, 'users', currentUser.uid);
                const userDocSnapshot = await getDoc(userDocRef);

                if (userDocSnapshot.exists()) {
                    const userData = userDocSnapshot.data();
                    const fetchedRole = userData.role;
                    setRole(fetchedRole);
                    console.log("role fetched : ", fetchedRole)
                    setRoleFetched(true);
                } else {
                    console.error('User data not found.');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }

        };

        if (!roleFetched) {
            fetchRole();
        }

    }, [roleFetched]);



    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const eventDocRef = doc(database, `clubs/${clubId}/events/${eventId}`);
                const eventDocSnapshot = await getDoc(eventDocRef);

                if (eventDocSnapshot.exists()) {
                    const eventData = eventDocSnapshot.data();
                    setEvent(eventData);
                } else {
                    console.error('Event data not found.');
                }
            } catch (error) {
                console.error('Error fetching event data:', error);
            }
        };

        fetchEventDetails();
    }, [eventId, forceRender]);

    if (!event) {
        return null;
    }
    const registerForEvent = async () => {
        try {
            const currentUserUID = auth.currentUser.uid;
            const eventDocRef = doc(database, `clubs/${clubId}/events/${eventId}`);
            await updateDoc(eventDocRef, {
                event_registered_members: arrayUnion(currentUserUID),
                event_reg_count: event.event_registered_members.length + 1,
            });

            const userDocRef = doc(database, 'users', currentUserUID);
            await updateDoc(userDocRef, {
                reg_event: arrayUnion(eventId)
            });

            setIsRegistered(true);
        } catch (error) {
            console.error('Error registering for event:', error);
        }
    };

    const closeRegisterEvent = async () => {
        try {
            const currentUserUID = auth.currentUser.uid;
            const eventDocRef = doc(database, `clubs/${clubId}/events/${eventId}`);
            await updateDoc(eventDocRef, {
                event_reg_status: 'closed',

            });
            setForceRender(prev => !prev);
        } catch (error) {
            console.error('Error registering for event:', error);
        }
    };

    const goToRegisteredPage = () => {
        navigation.navigate("RegisteredMembers", { eventId, registered_members: event.event_registered_members });


    }
    const toggleMenu = () => {
        setMenuVisible(!menuVisible);
    };


    const closeEvent = async () => {
        try {
            const eventDocRef = doc(database, `clubs/${clubId}/events/${eventId}`);
            await updateDoc(eventDocRef, {
                event_status: 'closed',
                event_reg_status: 'closed'
            });
            setForceRender(prev => !prev);
            closeMenu()
        } catch (error) {
            console.error('Error closing/marking event as closed:', error);
        }
    }
    const closeMenu = () => {
        setMenuVisible(false);
    };


    const cancelEvent = () => {
        console.log("cancelled")
    }

    const handleMarkAttendance = () => {
        console.log("sent clubId", clubId)
        navigation.navigate("MarkEvent", { eventId, event_registered_members: event.event_registered_members, role: role, clubId: clubId });
        closeMenu();
    };
    const { event_name, event_date, event_time, event_price, event_description, event_location, event_reg_count, event_reg_status, event_status, event_registered_members } = event;
    const [year, month, day] = event_date.split('-');
    const shortMonth = month.slice(0, 3).toUpperCase();


    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="black" />

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={30} color="black" />
            </TouchableOpacity>

            <View style={styles.createContainer}>
                <Text style={styles.title}>Event Details</Text>
            </View>

            {role === 'owner' && (
                <TouchableOpacity style={{ position: 'absolute', top: 20, right: 20 }} onPress={toggleMenu}>
                    {menuVisible ? (
                        <Ionicons name="close" size={30} color="black" />
                    ) : (
                        <Ionicons name="menu" size={30} color="black" />
                    )}
                </TouchableOpacity>
            )}
            {menuVisible && (
                <View style={{
                    position: 'absolute', top: 70, left: 0, right: 0, justifyContent: 'center', alignContent: 'center', alignItems: 'center', textAlign: 'center', zIndex: 6000, right: 0, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 10, height: 210 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 500, borderTopLeftRadius: 15, borderBottomLeftRadius: 15
                }}>
                    <TouchableOpacity style={{
                        marginBottom: 0, marginTop: 0, backgroundColor: 'black', padding: 10, borderTopLeftRadius: 0, width: '100%', borderBottomColor: 'white', borderWidth: 1
                    }} onPress={handleMarkAttendance}>
                        <Text style={{ fontFamily: "DMSans-Regular", fontSize: 17, color: 'white', }}>Mark Attendance</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginBottom: 0, marginTop: 0, padding: 10, backgroundColor: '#D34444', borderBottomLeftRadius: 0, width: '100%', borderBottomColor: 'white', borderWidth: 1 }} onPress={cancelEvent}>
                        <Text style={{ fontFamily: "DMSans-Regular", fontSize: 17, color: 'white' }}>Cancel Event</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginBottom: 0, marginTop: 0, padding: 10, backgroundColor: 'black', borderBottomLeftRadius: 0, width: '100%', borderBottomColor: 'white', borderWidth: 1 }} onPress={() => setModalVisibleCompleted(true)}>
                        <Text style={{ fontFamily: "DMSans-Regular", fontSize: 17, color: 'white' }} >Mark as Complete</Text>
                    </TouchableOpacity>
                </View>
            )}
            <Text style={styles.eventName}>{event_name}</Text>

            <View style={styles.dateTimeContainer}>

                <View style={styles.dateContainer}>
                    <Text style={styles.eventMonth}>{shortMonth}</Text>
                    <Text style={styles.eventDay}>{day}</Text>
                </View>

                <View style={styles.timePriceContainer}>

                    <View style={[styles.timeContainer, { backgroundColor: '#D9E7EC', padding: 3, borderRadius: 7, width: 90 }]}>
                        <Text style={[styles.eventTime, { fontSize: 19, fontFamily: 'DMSans-Bold' }]}>{event_time}</Text>
                    </View>

                    <View style={[styles.priceContainer, { backgroundColor: '#D1FFAD', padding: 3, borderRadius: 7, width: 65, marginTop: 2 }]}>
                        <Text style={[styles.eventPrice, { fontSize: 19, fontFamily: 'DMSans-Bold' }]}>{event_price.toUpperCase()}</Text>
                    </View>
                </View>

            </View>
            <View style={[styles.locationContainer, { backgroundColor: 'white', height: 100 }]}>
                <Image source={require('../assets/placeholder.png')} style={[styles.locationIcon, { width: 22, resizeMode: 'contain', marginTop: -225, marginLeft: 30 }]} />
                <Text style={[styles.eventLocation, { fontSize: 17, fontFamily: 'DMSans-Medium', marginTop: -266, marginLeft: 56 }]}>{event_location}</Text>
            </View>

            <View style={[styles.descContainer, { marginLeft: 30, marginRight: 30, marginTop: -30, textAlign: 'left' }]}>
                <Text style={[styles.desc, { fontSize: 17, fontFamily: 'DMSans-Medium' }]}>{event_description}</Text>
            </View>
            <View style={[styles.regCount, { backgroundColor: '#FFEFF2', width: 150, marginLeft: 30, marginTop: 20, borderRadius: 8, flexDirection: 'row' }]}>
                <View style={{ padding: 6, }}>
                    <Text style={{ fontSize: 15, fontFamily: 'DMSans-Medium' }}>Registration</Text>
                    <Text style={{ fontSize: 15, fontFamily: 'DMSans-Medium' }}>Count</Text>
                </View>
                <View style={{ borderLeftColor: 'white', borderLeftWidth: 2.5, }}>
                    <Text style={{ fontSize: 30, fontFamily: 'DMSans-Bold', textAlign: 'center', width: 50, marginTop: 5 }}>{event_reg_count}</Text>
                </View>
            </View>

            {role === 'owner' && (
                <>
                    <View style={styles.ownerButtons}>
                        <TouchableOpacity style={styles.viewButton} onPress={goToRegisteredPage}>
                            <Text style={styles.viewButtonText}>View Registered Members</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisibleClose(true)}>
                            <Text style={styles.closeButtonText}>Close Registration</Text>
                        </TouchableOpacity>
                    </View>
                </>

            )}

            {role === 'owner' && event_reg_status === 'closed' && (
                <>
                    <View style={styles.ownerButtons}>
                        <TouchableOpacity style={styles.viewButton} onPress={goToRegisteredPage}>
                            <Text style={styles.viewButtonText}>View Registered Members</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Registration Closed</Text>
                        </TouchableOpacity>
                    </View>
                </>

            )}
            {role === 'member' && event_reg_status === 'closed' && (
                <>
                    <View style={styles.ownerButtons}>

                        <TouchableOpacity style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Registration Closed</Text>
                        </TouchableOpacity>
                    </View>
                </>

            )}
            {role === 'owner' && event_status === 'closed' && (
                <>
                    <View style={styles.ownerButtons}>
                        <TouchableOpacity style={styles.viewButton} onPress={goToRegisteredPage}>
                            <Text style={styles.viewButtonText}>View Registered Members</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.closeButton, { borderWidth: 0.5, borderColor: 'green', backgroundColor: 'white' }]}>
                            <Text style={[styles.closeButtonText, { color: 'black', fontFamily: 'DMSans-Bold' }]}>Event Completed ✅</Text>
                        </TouchableOpacity>
                    </View>
                </>

            )}

            {/* Close Event / Mark Event as Completed */}
            <Modal
                visible={modalVisibleCompleted}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisibleCompleted(false)}
            >
                <View style={styles.modalContainer}>
                    <StatusBar backgroundColor="black" />
                    <View style={[styles.createContainerModal, {
                        backgroundColor: '#A6D3E3', height: 70, width: '89%', flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: 'black', borderTopLeftRadius: 10, borderTopRightRadius: 10,
                    }]}>
                        <TouchableOpacity style={[styles.backButton, { marginLeft: 5, marginTop: 5, height: 40 }]} onPress={() => setModalVisibleCompleted(false)}>
                            <Ionicons name="arrow-back" size={30} color="black" />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { fontSize: 23, textAlign: 'center', width: '71%', justifyContent: 'center', alignContent: 'center', marginTop: 20, color: 'black', fontFamily: "DMSans-Medium", }]}></Text>

                    </View>

                    {/* Close Event / Mark Event as Completed */}
                    <View style={[styles.modalContent, {
                        width: '89%',
                        backgroundColor: 'white',
                        borderBottomLeftRadius: 10,
                        borderBottomRightRadius: 10,
                        overflow: 'hidden',
                        padding: 20,
                        paddingTop: 50,


                    }]}>
                        <View style={[styles.contentContainer, { backgroundColor: 'white', }]}>
                            <Text style={[styles.clubDescription, { fontFamily: "DMSans-Regular", marginTop: 3, fontSize: 20.7, marginLeft: 0.5, marginRight: 0.5, textAlign: 'center' }]}>Do you want to mark the event as completed?</Text>
                            <Image source={require('../assets/loading.gif')} style={{
                                backgroundColor: 'white', width: "100%", height: 60, resizeMode: 'contain',
                            }} />

                            <TouchableOpacity style={[styles.joinButton, { marginLeft: 0, marginRight: 0, backgroundColor: 'black', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 20, }]}
                                onPress={() => {
                                    closeEvent();
                                    setModalVisibleCompleted(false);
                                }}>
                                <Text style={[styles.joinButtonText, { color: 'white', fontSize: 17, fontFamily: 'Inter-SemiBold' }]}>Yes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>
            </Modal>




            <Modal
                visible={modalVisibleClose}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisibleClose(false)}
            >
                <View style={styles.modalContainer}>
                    <StatusBar backgroundColor="black" />
                    <View style={[styles.createContainerModal, {
                        backgroundColor: '#A6D3E3', height: 70, width: '89%', flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: 'black', borderTopLeftRadius: 10, borderTopRightRadius: 10,
                    }]}>
                        <TouchableOpacity style={[styles.backButton, { marginLeft: 5, marginTop: 5, height: 40 }]} onPress={() => setModalVisibleClose(false)}>
                            <Ionicons name="arrow-back" size={30} color="black" />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { fontSize: 23, textAlign: 'center', width: '71%', justifyContent: 'center', alignContent: 'center', marginTop: 20, color: 'black', fontFamily: "DMSans-Medium", }]}></Text>

                    </View>

                    {/* Close Registration */}
                    <View style={[styles.modalContent, {
                        width: '89%',
                        backgroundColor: 'white',
                        borderBottomLeftRadius: 10,
                        borderBottomRightRadius: 10,
                        overflow: 'hidden',
                        padding: 20,
                        paddingTop: 50,


                    }]}>
                        <View style={[styles.contentContainer, { backgroundColor: 'white', }]}>
                            <Text style={[styles.clubDescription, { fontFamily: "DMSans-Regular", marginTop: 3, fontSize: 20.7, marginLeft: 0.5, marginRight: 0.5, textAlign: 'center' }]}>Do you want to close the event registration?</Text>
                            <Image source={require('../assets/loading.gif')} style={{
                                backgroundColor: 'white', width: "100%", height: 60, resizeMode: 'contain',
                            }} />

                            <TouchableOpacity style={[styles.joinButton, { marginLeft: 0, marginRight: 0, backgroundColor: 'black', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 20, }]}
                                onPress={() => {
                                    closeRegisterEvent();
                                    setModalVisibleClose(false);
                                }}>
                                <Text style={[styles.joinButtonText, { color: 'white', fontSize: 17, fontFamily: 'Inter-SemiBold' }]}>Yes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>


            {role === 'member' && event_reg_status === 'open' && event_status === 'open' && (
                <>
                    <View style={styles.ownerButtons}>
                        <TouchableOpacity style={styles.regButton} onPress={() => setModalVisible(true)}>
                            <Text style={styles.regButtonText}>Register Now</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
            {/* {role === 'member' && event_reg_status === 'closed' && event_status === 'closed' && (
                <>
                    <View style={styles.ownerButtons}>
                        <TouchableOpacity style={styles.regButton} >
                            <Text style={[styles.regButtonText,{backgroundColor:'#'}]}>Registration Closed</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )} */}

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <StatusBar backgroundColor="black" />
                    <View style={[styles.createContainerModal, {
                        backgroundColor: '#A6D3E3', height: 70, width: '89%', flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: 'black', borderTopLeftRadius: 10, borderTopRightRadius: 10,
                    }]}>
                        <TouchableOpacity style={[styles.backButton, { marginLeft: 20, marginTop: 17, height: 40 }]} onPress={() => setModalVisible(false)}>
                            <Ionicons name="arrow-back" size={30} color="black" />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { fontSize: 23, textAlign: 'center', width: '71%', justifyContent: 'center', alignContent: 'center', marginTop: 20, color: 'black', fontFamily: "DMSans-Medium", }]}></Text>

                    </View>
                    <View style={[styles.modalContent, {
                        width: '89%', backgroundColor: 'white', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, overflow: 'hidden', padding: 20, paddingTop: 50,


                    }]}>
                        <View style={[styles.contentContainer, { backgroundColor: 'white', }]}>
                            <Text style={[styles.clubDescription, { fontFamily: "DMSans-Regular", marginTop: 3, fontSize: 20.7, marginLeft: 0.5, marginRight: 0.5, textAlign: 'center' }]}>Do you want to register for this event?</Text>
                            <Image source={require('../assets/loading.gif')} style={{
                                backgroundColor: 'white', width: "100%", height: 60, resizeMode: 'contain',
                            }} />

                            <TouchableOpacity style={[styles.joinButton, { marginLeft: 0, marginRight: 0, backgroundColor: 'black', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 20, }]}
                                onPress={() => {
                                    registerForEvent();
                                    setModalVisible(false);
                                }}>
                                <Text style={[styles.joinButtonText, { color: 'white', fontSize: 17, fontFamily: 'Inter-SemiBold' }]}>Yes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            {isRegistered && (
                <>
                    <View style={styles.ownerButtons}>
                        <TouchableOpacity style={styles.viewButton}>
                            <Text style={styles.viewButtonText}>You have registered ✅</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        flex: 1,
    },
    ownerButtons: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: -500,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewButton: {
        width: '82%',
        marginLeft: 30,
        marginRight: 30,
        backgroundColor: 'black',
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    viewButtonText: {
        color: '#fff',
        fontSize: 17,
        fontFamily: 'DMSans-Medium'
    },
    closeButton: {
        width: '82%',
        marginLeft: 30,
        marginRight: 30,
        backgroundColor: '#D34444',
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 17,
        fontFamily: 'DMSans-Medium'

    },
    regButton: {
        width: '82%',
        marginLeft: 30,
        marginRight: 30,
        backgroundColor: '#0A750E',
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    regButtonText: {
        color: 'white',
        fontSize: 17,
        fontFamily: 'DMSans-Medium'
    },
    backButton: {
        position: 'absolute',
        top: 16,
        left: 20,
        zIndex: 1,
    },
    title: {
        fontSize: 24,
        marginTop: 19,
        textAlign: 'center',
        color: 'black',
        fontFamily: "DMSans-Bold",
        // backgroundColor:'red'
    },
    createContainer: {
        backgroundColor: '#A6D3E3',
        height: 70,
        borderBottomWidth: 2,
        borderBottomColor: 'black'
        // marginTop: 30,
    },
    eventName: {
        fontSize: 28,
        fontFamily: 'DMSans-Medium',
        color: 'black',
        height: 60,
        paddingLeft: 26,
        justifyContent: 'center',
        alignContent: 'center',
        paddingTop: 20,
        // backgroundColor: 'blue'
    },
    dateTimeContainer: {
        flexDirection: 'row',
        marginTop: 20,
    },
    dateContainer: {
        marginRight: 10,
        padding: 10,
        width: 65,
        borderRadius: 9,
        marginLeft: 30,
        backgroundColor: '#143946'
    },
    eventMonth: {
        fontSize: 16,
        fontFamily: 'DMSans-Medium',
        color: 'white',
        textAlign: 'center'
    },
    eventDay: {
        fontSize: 29,
        fontFamily: 'DMSans-Medium',
        color: 'white',
        marginTop: -5,
        textAlign: 'center'
    },
    timePriceContainer: {
        flexDirection: 'column',
    },
    priceContainer: {
        // marginTop:2
    },
    eventTime: {
        fontSize: 18,
        padding: 2,
        color: '#143946',
    },
    eventPrice: {
        fontSize: 18,
        padding: 2,
        color: '#143946',
    },
});

export default RegisterEvent;

