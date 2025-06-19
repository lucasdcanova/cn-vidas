import React from 'react';
import { Helmet } from 'react-helmet';
import DailyVideoCall from '@/components/telemedicine/DailyVideoCall';

/**
 * Test page for the new clean DailyVideoCall implementation
 * This page tests the audio/video functionality without complex logic
 */
export default function TestDailyClean() {
  // Test room URL - replace with actual room
  const testRoomUrl = 'https://cnvidas.daily.co/test-room';
  
  return (
    <>
      <Helmet>
        <title>Test Daily Clean - CNVidas</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Test Daily Clean Implementation</h1>
          <p className="text-gray-600 mb-6">
            This page tests the new DailyVideoCall component with focus on audio functionality.
          </p>
          
          <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
            <DailyVideoCall
              roomUrl={testRoomUrl}
              userName="Test User"
              onJoinCall={() => console.log('✅ Joined call')}
              onLeaveCall={() => console.log('👋 Left call')}
              onParticipantJoined={(p) => console.log('👤 Participant joined:', p)}
              onParticipantLeft={(p) => console.log('👋 Participant left:', p)}
              enableRecording={false}
            />
          </div>
          
          <div className="mt-6 space-y-2">
            <h2 className="text-lg font-semibold">Test Instructions:</h2>
            <ul className="list-disc list-inside text-gray-600">
              <li>The video call should auto-start when the page loads</li>
              <li>Audio should be enabled by default (check console logs)</li>
              <li>Video should display properly without needing to toggle</li>
              <li>Controls should work smoothly (mute/unmute, camera on/off)</li>
              <li>Check browser console for detailed logs</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}